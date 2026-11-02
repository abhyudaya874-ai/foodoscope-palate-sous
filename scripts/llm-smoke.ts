// Smoke test: one tiny completion per available provider key. Prints provider/model/latency.
import path from "node:path";
import { readFileSync } from "node:fs";
import { PROVIDERS, providerKey } from "../src/lib/llm/providers";
import { chatCompletion } from "../src/lib/llm/client";
import { candidatesForRole } from "../src/lib/llm/models.config";
import type { ProviderId, Role } from "../src/lib/llm/types";

try {
  for (const line of readFileSync(path.join(process.cwd(), ".env.local"), "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch { /* no env file */ }

const role: Role = (process.argv[2] as Role) ?? "router";
const picks = candidatesForRole(role);
console.log(`role=${role} candidates: ${picks.map((p) => `${p.provider}/${p.model}${p.fellBack ? "(fallback-pick)" : ""}`).join(", ") || "none"}`);

for (const id of Object.keys(PROVIDERS) as ProviderId[]) {
  const key = providerKey(id);
  if (!key) {
    console.log(`${id}: SKIP (no key)`);
    continue;
  }
  const pick = picks.find((p) => p.provider === id);
  if (!pick) {
    console.log(`${id}: SKIP (no chat model in cache list)`);
    continue;
  }
  const t0 = Date.now();
  try {
    const out = await chatCompletion({
      baseUrl: PROVIDERS[id].baseUrl, apiKey: key, model: pick.model,
      messages: [{ role: "user", content: "Reply with the single word: ok" }],
      maxTokens: 8, provider: id,
    });
    console.log(`${id}: model=${pick.model} latency=${Date.now() - t0}ms text=${JSON.stringify(out.text.slice(0, 40))} in=${out.usage.tokensIn} out=${out.usage.tokensOut}`);
  } catch (e) {
    console.log(`${id}: FAIL ${e instanceof Error ? e.message.slice(0, 140) : e}`);
  }
}
