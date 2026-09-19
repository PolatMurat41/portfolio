import { NextResponse } from "next/server";

export async function GET() {
  const encoded = process.env.ADMIN_PASSWORD_HASH ?? "";
  const decoded = Buffer.from(encoded, "base64").toString("utf-8");
  return NextResponse.json({
    encodedLength: encoded.length,
    decodedLength: decoded.length,
    decodedPrefix: decoded.slice(0, 10),
    decodedSuffix: decoded.slice(-6),
  });
}
