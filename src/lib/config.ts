// THE only module that reads process.env / env files (rule 4: dependency injection).
// Load order: ~/.config/palate-sous.env (real secrets, outside repo) -> .env.local -> process.env.
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

const files = [path.join(homedir(), ".config", "palate-sous.env"), path.join(process.cwd(), ".env.local")];
const loaded = new Map<string, string>();
let init = false;

function init_() {
  if (init) return;
  init = true;
  for (const f of files) {
    if (!existsSync(f)) continue;
    for (const line of readFileSync(f, "utf8").split("\n")) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m && m[2] !== "") {
        loaded.set(m[1], m[2]);
        if (!process.env[m[1]]) process.env[m[1]] = m[2]; // populate for adapters that read process.env
      }
    }
  }
}

export function env(name: string): string | undefined {
  init_();
  return process.env[name] || loaded.get(name);
}

init_(); // importing this module populates process.env from the env files

export const config = {
  keys: {
    get tavily() { return env("TAVILY_API_KEY"); },
    get exa() { return env("EXA_API_KEY"); },
    get groq() { return env("GROQ_API_KEY"); },
    get nvidia() { return env("NVIDIA_API_KEY"); },
    get openrouter() { return env("OPENROUTER_API_KEY"); },
    get foodoscope() { return env("FOODOSCOPE_API_KEY"); },
  },
  cocktailDbEnabled: () => env("COCKTAILDB_ENABLED") === "true",
  onVercel: () => env("VERCEL") === "1",
};
