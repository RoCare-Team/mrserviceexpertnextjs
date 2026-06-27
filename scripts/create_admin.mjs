#!/usr/bin/env node
/**
 * Create (or seed) an admin account from the command line.
 *
 *   node scripts/create_admin.mjs --email you@x.com --password "Secret123" --name "You" --role super_admin
 *
 * It reads DB credentials from .env.local / .env (same vars the app uses),
 * hashes the password with the SAME scrypt scheme as src/lib/password.js,
 * and upserts the row. Use role=super_admin for the very first account.
 */
import mysql from "mysql2/promise";
import { scrypt, randomBytes } from "node:crypto";
import { promisify } from "node:util";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const scryptAsync = promisify(scrypt);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

/* ---- tiny .env loader (no dependency) ---- */
function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    try {
      const txt = readFileSync(resolve(ROOT, file), "utf8");
      for (const line of txt.split("\n")) {
        const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
        if (!m) continue;
        let [, k, v] = m;
        v = v.replace(/^["']|["']$/g, "");
        if (process.env[k] === undefined) process.env[k] = v;
      }
    } catch {}
  }
}

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

async function hashPassword(plain) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scryptAsync(plain, salt, 64);
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

(async () => {
  loadEnv();

  const name = arg("name", "Super Admin");
  const email = (arg("email") || "").trim().toLowerCase();
  const password = arg("password");
  const role = arg("role", "super_admin");

  if (!email || !password) {
    console.error('Usage: node scripts/create_admin.mjs --email you@x.com --password "Secret123" [--name "Name"] [--role super_admin|admin]');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 3306,
  });

  try {
    const hash = await hashPassword(password);
    const [existing] = await pool.query(`SELECT id FROM admin_users WHERE email = ? LIMIT 1`, [email]);

    if (existing.length) {
      await pool.query(
        `UPDATE admin_users SET name=?, password=?, role=?, status=1 WHERE email=?`,
        [name, hash, role, email]
      );
      console.log(`✓ Updated existing admin: ${email} (role: ${role})`);
    } else {
      await pool.query(
        `INSERT INTO admin_users (name, email, password, role, status, created_at)
         VALUES (?, ?, ?, ?, 1, NOW())`,
        [name, email, hash, role]
      );
      console.log(`✓ Created admin: ${email} (role: ${role})`);
    }
    console.log("  You can now sign in at /admin/login");
  } catch (e) {
    console.error("✗ Failed:", e.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
