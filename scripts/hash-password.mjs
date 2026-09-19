import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password) {
  console.error("Usage: node scripts/hash-password.mjs <password>");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
// Base64-encoded: raw bcrypt hashes contain literal "$" characters that
// some deployment env var input pipelines (e.g. Vercel's CLI/API) have
// been observed to truncate or corrupt. ADMIN_PASSWORD_HASH is decoded
// from base64 at login time (see src/app/api/admin/login/route.ts).
console.log(Buffer.from(hash, "utf-8").toString("base64"));
