// demo:record — one real (tiny-budget) live run; writes events + fixtures + the SSE replay fixture.
import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

let hasKey = false;
try {
  const env = readFileSync(".env.local", "utf8");
  hasKey = /^FOODOSCOPE_API_KEY=\S+/m.test(env);
} catch { /* none */ }

if (!hasKey) {
  console.log("no FOODOSCOPE_API_KEY in .env.local — nothing to record.");
  console.log("Replay stays valid: `pnpm demo:replay` uses committed fixtures/api/* + fixtures/demo-run.jsonl.");
  console.log("Add the key, then re-run `pnpm demo:record`.");
  process.exit(0);
}

console.log("recording one live run (tiny budget)…");
execFileSync("pnpm", ["tsx", "scripts/run-sous.ts", "--live", "--fixture", "fixtures/demo-run.jsonl"], { stdio: "inherit" });
execFileSync("bash", ["scripts/scan-secrets.sh"], { stdio: "inherit" });
console.log("done. commit the new fixtures + events.");
