export const SESSION_COOKIE_NAME = "admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const encoder = new TextEncoder();

async function getKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is not set");
  }
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function toBase64Url(bytes: ArrayBuffer): string {
  const view = new Uint8Array(bytes);
  let binary = "";
  for (let i = 0; i < view.length; i++) binary += String.fromCharCode(view[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

export async function createSessionCookieValue(): Promise<string> {
  const expires = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = `admin.${expires}`;
  const key = await getKey();
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return `${payload}.${toBase64Url(signature)}`;
}

export async function verifySessionCookieValue(value: string | undefined): Promise<boolean> {
  if (!value) return false;
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  const [marker, expiresRaw, signatureB64] = parts;
  if (marker !== "admin") return false;
  const expires = Number(expiresRaw);
  if (!Number.isFinite(expires) || Date.now() > expires) return false;
  const key = await getKey();
  const expectedSignature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${marker}.${expiresRaw}`)
  );
  return timingSafeEqual(toBase64Url(expectedSignature), signatureB64);
}

export const SESSION_COOKIE_MAX_AGE = MAX_AGE_SECONDS;
