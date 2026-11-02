import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import type { SseMessage, SseType } from "../ui/sseMap";

export class RunChannel {
  messages: SseMessage[] = [];
  private subs = new Set<(m: SseMessage) => void>();
  private seq = 0;
  closed = false;

  constructor(public id: string) {}

  push(type: SseType, data: unknown): SseMessage {
    const m: SseMessage = { seq: ++this.seq, ts: new Date().toISOString(), type, data };
    this.messages.push(m);
    for (const s of this.subs) s(m);
    return m;
  }

  subscribe(cb: (m: SseMessage) => void): () => void {
    this.subs.add(cb);
    return () => this.subs.delete(cb);
  }

  close() {
    this.closed = true;
  }
}

class RunRegistry {
  runs = new Map<string, RunChannel>();
  create(id = `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`): RunChannel {
    const c = new RunChannel(id);
    this.runs.set(id, c);
    return c;
  }
  get(id: string) {
    return this.runs.get(id);
  }
}

// HMR-safe singleton for Next dev server.
const g = globalThis as unknown as { __runRegistry?: RunRegistry };
export const registry = (g.__runRegistry ??= new RunRegistry());

export function saveReplay(chan: RunChannel, file: string) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, chan.messages.map((m) => JSON.stringify(m)).join("\n") + "\n");
}

export function loadReplay(file: string): SseMessage[] {
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as SseMessage);
}

export async function replayInto(chan: RunChannel, file: string, speed = 1, signal?: AbortSignal): Promise<void> {
  const msgs = loadReplay(file);
  let lastTs: number | null = null;
  for (const m of msgs) {
    if (signal?.aborted) break;
    const t = Date.parse(m.ts);
    // recorded gaps are ms-scale; give each event type a watchable minimum so the run reads like live work
    const MIN: Record<string, number> = { plan: 600, "reasoning.delta": 1400, "tool.start": 700, probe: 1100, "tool.end": 600, "file.patch": 900, "csv.upsert": 900, "test.result": 1500, "confirm.request": 900, xp: 500, budget: 150, done: 400 };
    const gap = lastTs === null || Number.isNaN(t) ? 0 : Math.max(0, t - lastTs);
    const delay = Math.min(3000, Math.max(MIN[m.type] ?? 300, gap)) / speed;
    if (!Number.isNaN(t)) lastTs = t;
    await new Promise((r) => setTimeout(r, delay));
    chan.push(m.type, m.data);
  }
  chan.push("done", { replay: true });
  chan.close();
}
