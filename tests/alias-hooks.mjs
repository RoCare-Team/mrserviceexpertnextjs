// Test-only resolver: maps the "@/..." path alias (jsconfig) to ./src/... and
// adds the ".js" extension Next lets source files omit.
import { pathToFileURL, fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src");

export async function resolve(specifier, context, next) {
  if (specifier === "next/server" || specifier === "next/navigation") return next(`${specifier}.js`, context);
  if (specifier.startsWith("@/")) {
    let p = path.join(SRC, specifier.slice(2));
    if (!fs.existsSync(p) && fs.existsSync(`${p}.js`)) p = `${p}.js`;
    return next(pathToFileURL(p).href, context);
  }
  return next(specifier, context);
}
