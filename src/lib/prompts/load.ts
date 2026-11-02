import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { sha256 } from "../events/log";

const DIR = path.join(process.cwd(), "src", "lib", "prompts");

export interface LoadedPrompt {
  name: string;
  text: string;
  hash: string;
}

export function loadPrompt(name: string): LoadedPrompt {
  const file = path.join(DIR, `${name}.prompt.md`);
  const text = existsSync(file) ? readFileSync(file, "utf8") : "";
  return { name, text, hash: sha256(text).slice(0, 12) };
}

export function listPrompts(): string[] {
  if (!existsSync(DIR)) return [];
  return readdirSync(DIR).filter((f) => f.endsWith(".prompt.md")).map((f) => f.replace(".prompt.md", ""));
}
