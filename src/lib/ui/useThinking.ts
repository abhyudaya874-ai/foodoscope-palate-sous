"use client";
// Streams the real model thinking from /api/think. Presentation-side hook only.
import { useCallback, useRef, useState } from "react";

export interface Thinking { reasoning: string; text: string; provider?: string; model?: string; status: "idle" | "streaming" | "done" | "error"; ms?: number }

export function useThinking() {
  const [t, setT] = useState<Thinking>({ reasoning: "", text: "", status: "idle" });
  const abort = useRef<AbortController | null>(null);

  const start = useCallback(async (goal: string): Promise<void> => {
    abort.current?.abort();
    const ctl = new AbortController();
    abort.current = ctl;
    const t0 = Date.now();
    setT({ reasoning: "", text: "", status: "streaming" });
    try {
      const res = await fetch("/api/think", { method: "POST", body: JSON.stringify({ goal }), signal: ctl.signal });
      if (!res.body) throw new Error("no stream");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const frames = buf.split("\n\n");
        buf = frames.pop() ?? "";
        for (const fr of frames) {
          const ev = /event: (\w+)/.exec(fr)?.[1];
          const data = /data: (.*)/.exec(fr)?.[1];
          if (!ev || !data) continue;
          const d = JSON.parse(data) as { text?: string; provider?: string; model?: string; message?: string };
          if (ev === "meta") setT((p) => ({ ...p, provider: d.provider, model: d.model }));
          else if (ev === "reasoning") setT((p) => ({ ...p, reasoning: p.reasoning + (d.text ?? "") }));
          else if (ev === "text") setT((p) => ({ ...p, text: p.text + (d.text ?? "") }));
          else if (ev === "error") setT((p) => ({ ...p, status: "error", text: d.message ?? "" }));
          else if (ev === "done") setT((p) => ({ ...p, status: "done", ms: Date.now() - t0 }));
        }
      }
      setT((p) => (p.status === "streaming" ? { ...p, status: "done", ms: Date.now() - t0 } : p));
    } catch {
      setT((p) => (p.status === "streaming" ? { ...p, status: "error" } : p));
    }
  }, []);

  return { thinking: t, think: start };
}
