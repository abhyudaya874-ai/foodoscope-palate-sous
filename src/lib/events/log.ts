import { appendFileSync, mkdirSync, readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { createHash, randomBytes } from "node:crypto";
import { eventSchema, type AppEvent, type EventType, type Actor, type PayloadOf } from "./types";

export const EVENTS_DIR = path.join(process.cwd(), "events");

export interface EventBus {
  emit<T extends EventType>(type: T, actor: Actor, payload: PayloadOf<T>, evidence?: string): AppEvent;
  readonly runId: string;
}

export class JsonlEventBus implements EventBus {
  readonly runId: string;
  private file: string;
  constructor(runId = `run-${Date.now().toString(36)}-${randomBytes(3).toString("hex")}`, dir = EVENTS_DIR) {
    this.runId = runId;
    mkdirSync(dir, { recursive: true });
    this.file = path.join(dir, `${runId}.jsonl`);
  }
  emit<T extends EventType>(type: T, actor: Actor, payload: PayloadOf<T>, evidence?: string): AppEvent {
    const raw = {
      id: `ev-${Date.now().toString(36)}-${randomBytes(4).toString("hex")}`,
      ts: new Date().toISOString(),
      runId: this.runId,
      type, actor, payload, ...(evidence ? { evidence } : {}),
    };
    const event = eventSchema.parse(redactValue(raw)) as AppEvent;
    appendFileSync(this.file, JSON.stringify(event) + "\n");
    return event;
  }
}

export class MemoryEventBus implements EventBus {
  readonly runId = "run-test";
  events: AppEvent[] = [];
  emit<T extends EventType>(type: T, actor: Actor, payload: PayloadOf<T>, evidence?: string): AppEvent {
    const e = eventSchema.parse({
      id: `ev-${this.events.length}`, ts: new Date().toISOString(), runId: this.runId,
      type, actor, payload, ...(evidence ? { evidence } : {}),
    }) as AppEvent;
    this.events.push(e);
    return e;
  }
}

const SECRET_RE = /(gsk_[A-Za-z0-9]{20,}|nvapi-[A-Za-z0-9_-]{20,}|sk-or-[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9]{32,}|AKIA[0-9A-Z]{16})/g;
export function redactValue<T>(v: T): T {
  return JSON.parse(JSON.stringify(v, (_k, val) => (typeof val === "string" ? val.replace(SECRET_RE, "[REDACTED]") : val)));
}

export function readEvents(dir = EVENTS_DIR): AppEvent[] {
  if (!existsSync(dir)) return [];
  const out: AppEvent[] = [];
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".jsonl")).sort()) {
    for (const line of readFileSync(path.join(dir, f), "utf8").split("\n")) {
      if (!line.trim()) continue;
      const parsed = eventSchema.safeParse(JSON.parse(line));
      if (parsed.success) out.push(parsed.data as AppEvent);
    }
  }
  return out;
}

export function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}
