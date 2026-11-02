import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { sha256 } from "../events/log";
import { Budget } from "../llm/budget";

export class AuthError extends Error {
  constructor(msg: string) { super(msg); this.name = "AuthError"; }
}
export class RateLimitError extends Error {
  constructor(msg: string) { super(msg); this.name = "RateLimitError"; }
}
export class ContractError extends Error {
  constructor(msg: string) { super(msg); this.name = "ContractError"; }
}

export interface ProbeResult {
  path: string;
  status: number;
  body: unknown;
  latencyMs: number;
  fixture?: string;
  replay: boolean;
  rateLimit?: { limit?: number; remaining?: number; current?: number };
}

const BASE = "https://api.foodoscope.com";
const FIXTURE_DIR = path.join(process.cwd(), "fixtures", "api");
const MIN_INTERVAL_MS = 2500; // measured limit: 25/window -> stay under

export type ClientMode = "live" | "record" | "replay";

export class FoodoscopeClient {
  private lastCall = 0;
  constructor(
    public mode: ClientMode = "replay",
    private budget?: Budget,
    private opts: { baseUrl?: string; fixtureDir?: string; minIntervalMs?: number } = {},
  ) {}

  private key(): string | undefined {
    const k = process.env.FOODOSCOPE_API_KEY;
    return k && k.length > 0 ? k : undefined;
  }

  fixtureName(method: string, p: string, params?: Record<string, string>): string {
    const slug = p.replace(/^\/+|\/+$/g, "").replace(/[^a-z0-9]+/gi, ".").toLowerCase();
    const h = sha256(JSON.stringify({ method, p, params })).slice(0, 8);
    return `${slug}.${h}`;
  }

  async get(p: string, params?: Record<string, string>): Promise<ProbeResult> {
    const name = this.fixtureName("GET", p, params);
    const dir = this.opts.fixtureDir ?? FIXTURE_DIR;
    const file = path.join(dir, `${name}.json`);
    if (this.mode === "replay") {
      if (!existsSync(file)) throw new ContractError(`replay miss: ${p} (no fixture)`);
      const fx = JSON.parse(readFileSync(file, "utf8")) as { status: number; body: unknown; url: string };
      return { path: p, status: fx.status, body: fx.body, latencyMs: 0, fixture: `fixtures/api/${name}.json`, replay: true };
    }
    this.budget?.takeApi();
    this.budget?.takeWallet(1); // per-call token cost not in headers; 1 call = 1 unit assumed, see limits.json
    const wait = Math.max(0, MIN_INTERVAL_MS - (Date.now() - this.lastCall));
    if (wait) await new Promise((r) => setTimeout(r, wait));
    this.lastCall = Date.now();
    const t0 = Date.now();
    const url = new URL((this.opts.baseUrl ?? BASE) + p);
    for (const [k, v] of Object.entries(params ?? {})) url.searchParams.set(k, v);
    const headers: Record<string, string> = { accept: "application/json" };
    const k = this.key();
    if (k) headers.authorization = `Bearer ${k}`;
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
    const text = await res.text();
    let body: unknown;
    try { body = JSON.parse(text); } catch { body = text; }
    const rateLimit = {
      limit: num(res.headers.get("x-ratelimit-limit")),
      remaining: num(res.headers.get("x-ratelimit-remaining")),
      current: num(res.headers.get("x-ratelimit-current")),
    };
    const out: ProbeResult = { path: p, status: res.status, body, latencyMs: Date.now() - t0, replay: false, rateLimit };
    if (this.mode === "record") {
      mkdirSync(dir, { recursive: true });
      writeFileSync(file, JSON.stringify({ url: `${url.origin}${url.pathname}${url.search}`.replace(/ApiKey=[^&]+/g, "ApiKey=[redacted]"), status: res.status, body, recordedAt: new Date().toISOString() }));
      out.fixture = `fixtures/api/${name}.json`;
    }
    if (res.status === 401 || res.status === 403) throw new AuthError(`${p}: ${res.status} ${text.slice(0, 120)}`);
    if (res.status === 429) throw new RateLimitError(`${p}: 429`);
    return out;
  }
}

function num(v: string | null): number | undefined {
  const n = Number(v);
  return v !== null && !Number.isNaN(n) ? n : undefined;
}
