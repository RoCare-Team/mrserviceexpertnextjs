// Usage: node --import ./tests/alias.mjs --test tests/
import { register } from "node:module";
register("./alias-hooks.mjs", import.meta.url);
