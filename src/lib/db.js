import mysql from "mysql2/promise";

// The DB user has max_user_connections = 30, and that budget is shared by
// every `next build` worker process AND the live site at the same time —
// keep each process's slice small and let idle connections close.
const createPool = () =>
  mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),

    waitForConnections: true,
    connectionLimit: 5,
    maxIdle: 2,
    idleTimeout: 30_000,
  });

// Next.js bundles this module into each route's server chunk, so a plain
// module-level pool means one pool PER CHUNK (10+ pools in one process).
// Caching on globalThis guarantees one pool per process.
const db = globalThis._mysqlPool ?? createPool();

// The remote DB (GoDaddy) intermittently drops connections mid-build
// (ENETUNREACH bursts). Retry db.query() on connection-level errors only —
// never on SQL errors — so one network blip doesn't turn a city page into a
// prerendered 404. getConnection() users are NOT retried.
const TRANSIENT_ERRORS = new Set([
  "ENETUNREACH",
  "ETIMEDOUT",
  "ECONNREFUSED",
  "ECONNRESET",
  "EAI_AGAIN",
  "PROTOCOL_CONNECTION_LOST",
  "ER_USER_LIMIT_REACHED",
  "ER_CON_COUNT_ERROR",
]);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

if (!globalThis._mysqlPool) {
  const rawQuery = db.query.bind(db);
  db.query = async (...args) => {
    for (let attempt = 1; ; attempt++) {
      try {
        return await rawQuery(...args);
      } catch (err) {
        if (attempt >= 4 || !TRANSIENT_ERRORS.has(err.code)) throw err;
        await sleep(500 * attempt * attempt); // 0.5s, 2s, 4.5s
      }
    }
  };
  globalThis._mysqlPool = db;
}

export default db;
