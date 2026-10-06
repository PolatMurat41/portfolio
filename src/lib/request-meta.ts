import { createHash } from "node:crypto";

function clientIp(request: Request): string {
  const headers = request.headers;
  const forwarded =
    headers.get("x-vercel-forwarded-for") ?? headers.get("x-real-ip") ?? headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

// Salted hash of the visitor's IP: enough to rate-limit per visitor without
// storing the address itself.
export function hashClientIp(request: Request): string {
  return createHash("sha256")
    .update(`${process.env.SESSION_SECRET ?? ""}:${clientIp(request)}`)
    .digest("hex")
    .slice(0, 32);
}
