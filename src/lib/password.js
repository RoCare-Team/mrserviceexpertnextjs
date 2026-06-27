/**
 * Password hashing for admin accounts.
 *
 * - NEW accounts are hashed with Node's built-in scrypt (no native build).
 * - VERIFY also accepts bcrypt hashes ($2a$/$2b$/$2y$), so admin rows that
 *   were inserted with a bcrypt hash (e.g. straight from phpMyAdmin) still work.
 *
 * scrypt stored format:  scrypt$<saltHex>$<hashHex>
 */
import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import bcrypt from "bcryptjs";

const scryptAsync = promisify(scrypt);
const KEYLEN = 64;

export async function hashPassword(plain) {
  if (!plain || plain.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }
  const salt = randomBytes(16).toString("hex");
  const derived = await scryptAsync(plain, salt, KEYLEN);
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(plain, stored) {
  if (!stored || typeof stored !== "string") return false;

  // bcrypt hashes ($2a$, $2b$, $2y$)
  if (/^\$2[aby]\$/.test(stored)) {
    try {
      return await bcrypt.compare(plain, stored);
    } catch {
      return false;
    }
  }

  // scrypt format (scrypt$salt$hash)
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, hashHex] = parts;
  try {
    const derived = await scryptAsync(plain, salt, KEYLEN);
    const a = Buffer.from(hashHex, "hex");
    if (a.length !== derived.length) return false;
    return timingSafeEqual(a, derived);
  } catch {
    return false;
  }
}
