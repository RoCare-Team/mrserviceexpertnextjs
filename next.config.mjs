/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // The MySQL user allows only 30 connections, shared with the live site.
    // Each build worker opens its own pool (connectionLimit: 5 in lib/db.js),
    // so cap workers at 4 → at most 20 build-time connections.
    cpus: 4,
  },
};

export default nextConfig;
