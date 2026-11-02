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

  const stop = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
    setRunning(false);
  }, []);

  const attach = useCallback((id: string, from = 0) => {
    esRef.current?.close();
    const es = new EventSource(`/api/run/${id}/stream?from=${from}`);
    esRef.current = es;
    for (const t of TYPES) {
      es.addEventListener(t, (e) => {
        const m = JSON.parse((e as MessageEvent).data) as SseMessage;
        if (m.seq <= lastSeq.current) return; // dedupe by seq
        lastSeq.current = m.seq;
        setMessages((prev) => [...prev, m]);
        if (m.type === "done") { es.close(); setRunning(false); }
      });
    }
    es.onerror = () => { /* browser retries; resume handled by ?from */ };
  }, []);

  const play = useCallback(async (speed = 3) => {
    stop();
    lastSeq.current = 0;
    setMessages([]);
    setRunning(true);
    const res = await fetch("/api/run", { method: "POST", body: JSON.stringify({ speed }) });
    const { runId: id } = (await res.json()) as { runId: string };
    setRunId(id);
    attach(id);
  }, [attach, stop]);

  return { messages, running, runId, play, stop, attach };
}
