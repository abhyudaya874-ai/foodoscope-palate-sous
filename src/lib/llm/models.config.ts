import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { PROVIDERS, providerKey } from "./providers";
import type { ProviderId, Role } from "./types";

// Role -> ordered provider preferences. `prefer` regexes are hints only; the
// concrete model id is always chosen from the *fetched* provider model list.
export const ROLE_ROUTES: Record<Role, { provider: ProviderId; prefer?: RegExp[] }[]> = {
  router: [
    { provider: "groq", prefer: [/llama-3\.[13]-8b|instant|small/i] },
    { provider: "openrouter", prefer: [/mini|small|flash|haiku/i] },
    { provider: "nvidia", prefer: [/small|8b/i] },
  ],
  planner: [
    { provider: "nvidia", prefer: [/70b|large|reason|deepseek|qwen.*(?:72|32)b/i] },
    { provider: "openrouter", prefer: [/70b|large|reason/i] },
    { provider: "groq", prefer: [/70b|large|gpt-oss-120b/i] },
  ],
  coder: [
    { provider: "nvidia", prefer: [/coder|code|70b|qwen/i] },
    { provider: "openrouter", prefer: [/coder|code|sonnet|large/i] },
    { provider: "groq", prefer: [/70b|gpt-oss-120b/i] },
  ],
  matcher: [
    { provider: "groq", prefer: [/8b|instant|small/i] },
    { provider: "openrouter", prefer: [/mini|small|flash/i] },
    { provider: "nvidia", prefer: [/8b|small/i] },
  ],
  writer: [
    { provider: "openrouter", prefer: [/instruct|chat|70b|sonnet|gemini/i] },
    { provider: "nvidia", prefer: [/instruct|chat|70b/i] },
    { provider: "groq", prefer: [/70b|instruct/i] },
  ],
  browser: [
    { provider: "groq", prefer: [/qwen3\.8-27b/i] },
    { provider: "openrouter", prefer: [/mini|small|flash|haiku/i] },
    { provider: "nvidia", prefer: [/8b|small/i] },
  ],
};

// Ids that are never chat-completion models (embeddings, guards, audio, vision encoders).
const NON_CHAT = /embed|rerank|guard|whisper|audio|tts|image|vision|moderation|reward|retriever|diffusion|parakeet|canary|nvclip|bge|e5|ner|vila|aesthetic|safety/i;

export function chatModels(models: string[]): string[] {
  const chat = models.filter((m) => !NON_CHAT.test(m));
  return chat.length > 0 ? chat : models;
}

export interface ModelPick {
  provider: ProviderId;
  model: string;
  fellBack: boolean;
}

export function cachedModels(provider: ProviderId, fixturesDir = path.join(process.cwd(), "fixtures")): string[] {
  const file = path.join(fixturesDir, `models.${provider}.json`);
  if (!existsSync(file)) return [];
  const j = JSON.parse(readFileSync(file, "utf8")) as { models?: string[] };
  return j.models ?? [];
}

export function pickModel(
  role: Role,
  opts: { fixturesDir?: string; hasKey?: (p: ProviderId) => boolean } = {},
): ModelPick | null {
  const hasKey = opts.hasKey ?? ((p: ProviderId) => providerKey(p) !== undefined);
  for (const cand of ROLE_ROUTES[role]) {
    if (!hasKey(cand.provider)) continue;
    const models = chatModels(cachedModels(cand.provider, opts.fixturesDir));
    if (models.length === 0) continue;
    for (const re of cand.prefer ?? []) {
      const hit = models.find((m) => re.test(m));
      if (hit) return { provider: cand.provider, model: hit, fellBack: false };
    }
    return { provider: cand.provider, model: models[0], fellBack: true };
  }
  return null;
}

export function candidatesForRole(role: Role, opts: { fixturesDir?: string; hasKey?: (p: ProviderId) => boolean } = {}): ModelPick[] {
  const hasKey = opts.hasKey ?? ((p: ProviderId) => providerKey(p) !== undefined);
  const out: ModelPick[] = [];
  for (const cand of ROLE_ROUTES[role]) {
    if (!hasKey(cand.provider)) continue;
    const models = chatModels(cachedModels(cand.provider, opts.fixturesDir));
    if (models.length === 0) continue;
    const preferred = (cand.prefer ?? []).map((re) => models.find((m) => re.test(m))).find(Boolean);
    out.push({ provider: cand.provider, model: preferred ?? models[0], fellBack: !preferred });
  }
  return out;
}

export { PROVIDERS };
