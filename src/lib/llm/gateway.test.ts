import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { z } from "zod";
import { complete } from "./gateway";
import { Budget } from "./budget";
import { MemoryEventBus } from "../events/log";
import { BudgetError } from "./types";

const okBody = (text: string, model = "m1") =>
  JSON.stringify({ choices: [{ message: { content: text } }], usage: { prompt_tokens: 10, completion_tokens: 5 }, model });

let dir: string;
let fixturesDir: string;
const ORIG_ENV = { ...process.env };

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), "gw-"));
  fixturesDir = path.join(dir, "fixtures");
  mkdirSync(fixturesDir, { recursive: true });
  for (const p of ["groq", "nvidia", "openrouter"])
    writeFileSync(path.join(fixturesDir, `models.${p}.json`), JSON.stringify({ models: [`${p}-small`, `${p}-large`] }));
  process.env.GROQ_API_KEY = "groq-fake-key";
  process.env.NVIDIA_API_KEY = "nvidia-fake-key";
  process.env.OPENROUTER_API_KEY = "or-fake-key";
});
afterEach(() => {
  process.env = { ...ORIG_ENV };
  rmSync(dir, { recursive: true, force: true });
});

const deps = (f: typeof fetch, bus = new MemoryEventBus(), budget?: Budget) => ({
  fetchImpl: f, bus, budget, cacheDir: path.join(dir, "cache"), fixturesDir,
});

const cfg = { maxToolCallsPerRun: 40, maxApiCalls: 30, maxLlmTokensPerRun: 100, perRoleTokenCaps: {}, foodoscopeTokenWallet: 100 };

describe("gateway", () => {
  it("falls back to next provider on 429", async () => {
    const calls: string[] = [];
    const f = (async (url: unknown) => {
      calls.push(String(url));
      if (String(url).includes("groq")) return new Response("rate limited", { status: 429 });
      return new Response(okBody("hi"), { status: 200 });
    }) as typeof fetch;
    const out = await complete({ role: "router", messages: [{ role: "user", content: "x" }] }, deps(f));
    expect(out.provider).toBe("openrouter"); // router: groq -> openrouter -> nvidia
    expect(out.fallback).toBe(true);
    expect(calls.length).toBe(2);
  });

  it("retries once with repair prompt on invalid JSON", async () => {
    const schema = z.object({ a: z.number() });
    let n = 0;
    const f = (async () => new Response(okBody(n++ === 0 ? "not json" : '{"a":1}'), { status: 200 })) as typeof fetch;
    const out = await complete({ role: "router", messages: [{ role: "user", content: "x" }], schema, schemaName: "T" }, deps(f));
    expect(out.json).toEqual({ a: 1 });
    expect(n).toBe(2);
  });

  it("serves a cache hit with cache:true and no tokens", async () => {
    const f = (async () => new Response(okBody("cached"), { status: 200 })) as typeof fetch;
    const bus = new MemoryEventBus();
    const d = deps(f, bus);
    await complete({ role: "router", messages: [{ role: "user", content: "x" }] }, d);
    const out2 = await complete({ role: "router", messages: [{ role: "user", content: "x" }] }, d);
    expect(out2.cache).toBe(true);
    const cacheEvt = bus.events.filter((e) => e.type === "llm.call").at(-1);
    expect(cacheEvt?.type === "llm.call" && cacheEvt.payload.cache).toBe(true);
    expect(cacheEvt?.type === "llm.call" && cacheEvt.payload.tokensIn).toBe(0);
  });

  it("throws BudgetError when token cap exceeded", async () => {
    const f = (async () => new Response(okBody("y"), { status: 200 })) as typeof fetch;
    const budget = new Budget({ ...cfg, maxLlmTokensPerRun: 10 });
    await expect(
      complete({ role: "router", messages: [{ role: "user", content: "x" }] }, deps(f, new MemoryEventBus(), budget)),
    ).rejects.toBeInstanceOf(BudgetError);
  });

  it("never logs secrets in emitted events", async () => {
    const f = (async () => new Response(okBody("z"), { status: 200 })) as typeof fetch;
    const bus = new MemoryEventBus();
    await complete({ role: "router", messages: [{ role: "user", content: "x" }] }, deps(f, bus));
    const dump = JSON.stringify(bus.events);
    expect(dump).not.toContain("groq-fake-key");
    expect(dump).not.toContain("nvidia-fake-key");
    expect(dump).not.toContain("or-fake-key");
    expect(existsSync(path.join(dir, "cache"))).toBe(true);
  });
});
