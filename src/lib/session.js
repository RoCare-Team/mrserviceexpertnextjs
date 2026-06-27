/**
 * Stateless signed-session helper for the admin console.
 *
 * Uses Web Crypto (HMAC-SHA256) so the exact same code works in BOTH the
 * Node runtime (API routes) and the Edge runtime (middleware). No external
 * dependency, no Buffer.
 *
 * Token shape:  base64url(payloadJSON) . base64url(hmac)
 * Payload:      { sub, email, name, role, iat, exp }
 */

const COOKIE_NAME = "mse_admin_session";
const DEFAULT_TTL_SECONDS = 60 * 60 * 12; // 12h

function getSecret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      "AUTH_SECRET is missing or too short. Add a long random string to .env.local (see AUTH_SETUP.md)."
    );
  }
  return s;
}

/* ---- base64url helpers (work in Edge + Node, no Buffer) ---- */
function bytesToB64url(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlToBytes(str) {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
  const bin = atob(b64 + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
const enc = new TextEncoder();
const dec = new TextDecoder();

async function importKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/** Sign a payload object → token string. */
export async function signSession(payload, ttlSeconds = DEFAULT_TTL_SECONDS) {
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + ttlSeconds };
  const head = bytesToB64url(enc.encode(JSON.stringify(body)));
  const key = await importKey(getSecret());
  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(head));
  const sig = bytesToB64url(new Uint8Array(sigBuf));
  return `${head}.${sig}`;
}

/** Verify a token → payload object, or null if invalid/expired. */
export async function verifySession(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [head, sig] = token.split(".");
  if (!head || !sig) return null;
  try {
    const key = await importKey(getSecret());
    const ok = await crypto.subtle.verify(
      "HMAC",
      key,
      b64urlToBytes(sig),
      enc.encode(head)
    );
    if (!ok) return null;
    const payload = JSON.parse(dec.decode(b64urlToBytes(head)));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Read & verify the session cookie from a Request / NextRequest. */
export async function getSession(req) {
  // NextRequest exposes req.cookies.get(name).value; plain Request needs header parse
  let raw;
  if (req?.cookies?.get) {
    raw = req.cookies.get(COOKIE_NAME)?.value;
  } else {
    const header = req.headers.get("cookie") || "";
    const match = header.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
    raw = match ? decodeURIComponent(match[1]) : undefined;
  }
  return verifySession(raw);
}

/** Cookie attributes used when setting/clearing the session. */
export function sessionCookieOptions(maxAgeSeconds = DEFAULT_TTL_SECONDS) {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export { COOKIE_NAME, DEFAULT_TTL_SECONDS };
