import Anthropic from "@anthropic-ai/sdk";
import type { ChatbotSettings } from "@prisma/client";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

type ProviderSettings = Pick<
  ChatbotSettings,
  "provider" | "model" | "baseUrl" | "effort" | "temperature" | "maxTokens"
>;

export interface StreamChatOptions {
  settings: ProviderSettings;
  apiKey: string;
  system: string;
  messages: ChatTurn[];
  signal?: AbortSignal;
}

// `detail` is the provider's own message: shown in the admin playground and
// server logs, never to site visitors.
export class ChatProviderError extends Error {
  constructor(
    public code: "auth" | "model" | "rate_limit" | "bad_request" | "network" | "upstream",
    public detail: string
  ) {
    super(detail);
  }
}

// Models that take `output_config.effort` (Opus 4.5+, Sonnet 4.6+, Fable).
const EFFORT_MODELS = /^claude-(opus-4-[5-9]|opus-[5-9]|sonnet-4-[6-9]|sonnet-[5-9]|fable|mythos)/;
// Models that reject sampling parameters such as `temperature`.
const NO_SAMPLING_MODELS = /^claude-(opus-4-[7-9]|opus-[5-9]|sonnet-[5-9]|fable|mythos)/;
// Models that accept the server-side refusal fallback (`fallbacks: "default"`).
const FALLBACK_MODELS = /^claude-(fable-5-1|opus-5-5|opus-5|sonnet-5-5)$/;

const REFUSAL_TEXT =
  "Bu isteğe yanıt veremiyorum. / I can't help with that request.";

async function* streamAnthropic({ settings, apiKey, system, messages, signal }: StreamChatOptions) {
  const client = new Anthropic({ apiKey, maxRetries: 1 });
  const model = settings.model.trim();
  const useFallbacks = FALLBACK_MODELS.test(model);

  const stream = client.beta.messages.stream(
    {
      model,
      max_tokens: settings.maxTokens,
      // The system prompt (instructions + portfolio data) is identical for
      // every visitor, so it is cached across conversations.
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages,
      ...(EFFORT_MODELS.test(model) ? { output_config: { effort: settings.effort as "low" | "medium" | "high" } } : {}),
      ...(settings.temperature != null && !NO_SAMPLING_MODELS.test(model)
        ? { temperature: settings.temperature }
        : {}),
      // On a safety-classifier decline the API re-runs the request on
      // Anthropic's recommended fallback model instead of refusing.
      ...(useFallbacks ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
    },
    { signal }
  );

  let produced = false;
  try {
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        produced = true;
        yield event.delta.text;
      }
    }
    const final = await stream.finalMessage();
    // A refusal that survives the fallback chain ends the turn; say so instead
    // of leaving a silently cut-off answer.
    if (final.stop_reason === "refusal") yield produced ? `\n\n_${REFUSAL_TEXT}_` : REFUSAL_TEXT;
  } catch (error) {
    if (error instanceof Anthropic.APIUserAbortError) return;
    if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
      throw new ChatProviderError("auth", error.message);
    }
    if (error instanceof Anthropic.NotFoundError) throw new ChatProviderError("model", error.message);
    if (error instanceof Anthropic.RateLimitError) throw new ChatProviderError("rate_limit", error.message);
    if (error instanceof Anthropic.BadRequestError) throw new ChatProviderError("bad_request", error.message);
    if (error instanceof Anthropic.APIConnectionError) throw new ChatProviderError("network", error.message);
    if (error instanceof Anthropic.APIError) throw new ChatProviderError("upstream", error.message);
    throw error;
  }
}

function openAIErrorCode(status: number): ChatProviderError["code"] {
  if (status === 401 || status === 403) return "auth";
  if (status === 404) return "model";
  if (status === 429) return "rate_limit";
  if (status === 400 || status === 422) return "bad_request";
  return "upstream";
}

// Any OpenAI-compatible Chat Completions endpoint: OpenAI, OpenRouter, Groq,
// Together, LiteLLM, vLLM, Ollama...
async function* streamOpenAICompatible({ settings, apiKey, system, messages, signal }: StreamChatOptions) {
  const baseUrl = (settings.baseUrl?.trim() || "https://api.openai.com/v1").replace(/\/+$/, "");
  const isOpenAI = /^https:\/\/api\.openai\.com\//.test(`${baseUrl}/`);

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: settings.model.trim(),
        stream: true,
        // OpenAI's own API renamed the cap; compatible servers still use max_tokens.
        ...(isOpenAI ? { max_completion_tokens: settings.maxTokens } : { max_tokens: settings.maxTokens }),
        ...(settings.temperature != null ? { temperature: settings.temperature } : {}),
        messages: [{ role: "system", content: system }, ...messages],
      }),
      signal,
    });
  } catch (error) {
    if (signal?.aborted) return;
    throw new ChatProviderError("network", error instanceof Error ? error.message : String(error));
  }

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new ChatProviderError(openAIErrorCode(res.status), `HTTP ${res.status}: ${text.slice(0, 500)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newline: number;
      while ((newline = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (data === "[DONE]") return;
        let delta: unknown;
        try {
          delta = JSON.parse(data)?.choices?.[0]?.delta?.content;
        } catch {
          continue;
        }
        if (typeof delta === "string" && delta) yield delta;
      }
    }
  } catch (error) {
    if (signal?.aborted) return;
    throw new ChatProviderError("network", error instanceof Error ? error.message : String(error));
  }
}

export function streamChatReply(options: StreamChatOptions): AsyncGenerator<string> {
  return options.settings.provider === "openai" ? streamOpenAICompatible(options) : streamAnthropic(options);
}

// Wraps a reply generator in a text/plain streaming body. The first chunk is
// awaited before the response is created so that configuration errors (bad
// key, unknown model) surface as a normal JSON error instead of a 200 stream.
export async function createReplyStream(
  generator: AsyncGenerator<string>,
  handlers: { onComplete?: (text: string) => Promise<void> | void; errorNote: string }
): Promise<ReadableStream<Uint8Array>> {
  const first = await generator.next();
  const encoder = new TextEncoder();
  let full = first.done ? "" : first.value;
  let cancelled = false;

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (text: string) => {
        if (!cancelled && text) controller.enqueue(encoder.encode(text));
      };
      try {
        send(full);
        if (!first.done) {
          for (let chunk = await generator.next(); !chunk.done && !cancelled; chunk = await generator.next()) {
            full += chunk.value;
            send(chunk.value);
          }
        }
      } catch (error) {
        console.error("Chat stream failed mid-response:", error);
        send(handlers.errorNote);
      } finally {
        try {
          await handlers.onComplete?.(full);
        } catch (error) {
          console.error("Saving chat reply failed:", error);
        }
        if (!cancelled) controller.close();
      }
    },
    cancel() {
      cancelled = true;
    },
  });
}
