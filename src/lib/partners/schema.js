// Cached "does this column exist?" — lets new code run before its migration
// does (public pages must never break because a deploy came first).
import db from "@/lib/db";

const cache = (globalThis._mseCols ??= new Map());

export async function hasColumn(table, column) {
  const key = `${table}.${column}`;
  const hit = cache.get(key);
  if (hit && (hit.ok || Date.now() - hit.at < 60_000)) return hit.ok;
  let ok = false;
  try {
    const [cols] = await db.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [column]);
    ok = cols.length > 0;
  } catch {}
  cache.set(key, { ok, at: Date.now() }); // missing → re-checked after a minute
  return ok;
}
