// Fetch GET /models for each provider with a key; cache to fixtures/models.<provider>.json
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PROVIDERS, providerKey } from "../src/lib/llm/providers";
import { listModels } from "../src/lib/llm/client";
import type { ProviderId } from "../src/lib/llm/types";

// load .env.local manually (no dotenv dep)
const envFile = path.join(process.cwd(), ".env.local");
try {
  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch { /* no env file */ }

const dir = path.join(process.cwd(), "fixtures");
mkdirSync(dir, { recursive: true });

for (const id of Object.keys(PROVIDERS) as ProviderId[]) {
  const key = providerKey(id);
  if (!key) {
    console.log(`skip ${id}: no ${PROVIDERS[id].apiKeyEnv}`);
    continue;
  }
  try {
    const models = await listModels({ baseUrl: PROVIDERS[id].baseUrl, apiKey: key, provider: id });
    writeFileSync(path.join(dir, `models.${id}.json`), JSON.stringify({ provider: id, fetchedAt: new Date().toISOString(), models }, null, 2));
    console.log(`${id}: ${models.length} models -> fixtures/models.${id}.json`);
  } catch (e) {
    console.log(`${id}: fetch failed (${e instanceof Error ? e.message.slice(0, 120) : e})`);
  }
}
