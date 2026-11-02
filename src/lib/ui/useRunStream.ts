"use client";
import { useCallback, useRef, useState } from "react";
import type { SseMessage } from "./sseMap";

const TYPES = ["plan", "reasoning.delta", "text.delta", "tool.start", "tool.end", "tool.error", "file.patch", "csv.upsert", "test.result", "budget", "xp", "confirm.request", "checkpoint", "checkpoint.restore", "probe", "done"];

export function useRunStream() {
  const [messages, setMessages] = useState<SseMessage[]>([]);
  const [running, setRunning] = useState(false);
  const [runId, setRunId] = useState<string>();
  const esRef = useRef<EventSource | null>(null);
  const lastSeq = useRef(0);
  const gate = useRef(false);                 // true while waiting for a human decision
  const buf = useRef<SseMessage[]>([]);       // messages held behind the gate
  const autoRef = useRef(false);
  const awaitRef = useRef<string | null>(null);
  const [awaiting, setAwaiting] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<Record<string, "approved" | "denied" | "auto">>({});
  const [autoApprove, setAutoState] = useState(false);

  const stop = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
    gate.current = false; buf.current = []; awaitRef.current = null; setAwaiting(null);
    setRunning(false);
  }, []);

  const append = useCallback((m: SseMessage) => {
    setMessages((prev) => [...prev, m]);
    if (m.type === "done") { esRef.current?.close(); setRunning(false); }
    if (m.type === "confirm.request") {
      const p = String((m.data as { path?: string }).path ?? "");
      if (autoRef.current) setDecisions((d) => ({ ...d, [p]: "auto" }));
      else { gate.current = true; awaitRef.current = p; setAwaiting(p); }
    }
  }, []);

  const drain = useCallback(() => {
    while (buf.current.length && !gate.current) append(buf.current.shift() as SseMessage);
  }, [append]);

  /** Human decision on the pending write; the held stream resumes. */
  const decide = useCallback((approved: boolean) => {
    const p = awaitRef.current;
    if (p) setDecisions((d) => ({ ...d, [p]: approved ? "approved" : "denied" }));
    awaitRef.current = null; setAwaiting(null);
    gate.current = false;
    drain();
  }, [drain]);

  const setAutoApprove = useCallback((v: boolean) => {
    autoRef.current = v; setAutoState(v);
    if (v && gate.current) decide(true);
  }, [decide]);

  const attach = useCallback((id: string, from = 0) => {
    esRef.current?.close();
    const es = new EventSource(`/api/run/${id}/stream?from=${from}`);
    esRef.current = es;
    for (const t of TYPES) {
      es.addEventListener(t, (e) => {
        const m = JSON.parse((e as MessageEvent).data) as SseMessage;
        if (m.seq <= lastSeq.current) return; // dedupe by seq
        lastSeq.current = m.seq;
        if (gate.current) { buf.current.push(m); return; }
        append(m);
      });
    }
    es.onerror = () => { /* browser retries; resume handled by ?from */ };
  }, [append]);

  const play = useCallback(async (speed = 3) => {
    stop();
    lastSeq.current = 0;
    setMessages([]); setDecisions({});
    setRunning(true);
    const res = await fetch("/api/run", { method: "POST", body: JSON.stringify({ speed }) });
    const { runId: id } = (await res.json()) as { runId: string };
    setRunId(id);
    attach(id);
  }, [attach, stop]);

  return { messages, running, runId, play, stop, attach, awaiting, decisions, decide, autoApprove, setAutoApprove };
}
