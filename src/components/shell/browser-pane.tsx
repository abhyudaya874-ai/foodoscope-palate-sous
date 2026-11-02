"use client";
// Comet-style agentic browser pane. Plays a RECORDED browser-agent run: real screenshots, real element
// bounding boxes (scripts/browser-capture.ts) -> animated cursor, click ripple, navigation. Labelled REPLAY.
import * as React from "react";
import { GlobeIcon, LockIcon, MousePointer2Icon, SparklesIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Frame { n: number; url: string; title: string; from: { x: number; y: number }; cursor: { x: number; y: number }; action: string; thought: string; key?: string; result?: string }
interface Data { task: string; frames: Frame[] }
type Phase = "idle" | "moving" | "acting";

export function BrowserPane({ task, playKey, onStep }: { task: "rival" | "docs"; playKey: number; onStep?: (i: number, total: number, f: Frame) => void }) {
  const [data, setData] = React.useState<Data | null>(null);
  const [i, setI] = React.useState(0);
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [playing, setPlaying] = React.useState(false);
  const [lastKey, setLastKey] = React.useState(0);
  const [typed, setTyped] = React.useState("");

  React.useEffect(() => {
    let alive = true;
    fetch(`/browser/${task}/frames.json`).then((r) => r.json()).then((d: Data) => { if (alive) setData(d); }).catch(() => {});
    return () => { alive = false; };
  }, [task]);

  if (playKey !== lastKey) { setLastKey(playKey); setI(0); setPhase("idle"); setPlaying(playKey > 0); setTyped(""); }

  const frames = data?.frames ?? [];
  const f = frames[Math.min(i, frames.length - 1)];
  const last = i >= frames.length - 1;

  React.useEffect(() => {
    if (!playing || !f) return;
    onStep?.(i, frames.length, f);
    const t: ReturnType<typeof setTimeout>[] = [];
    t.push(setTimeout(() => setPhase("moving"), 500));
    t.push(setTimeout(() => setPhase("acting"), 1600));
    if (!last) t.push(setTimeout(() => { setI((v) => v + 1); setPhase("idle"); }, 2700));
    else t.push(setTimeout(() => setPlaying(false), 1800));
    return () => t.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, playing, frames.length]);

  // typewriter for the agent's thought line
  React.useEffect(() => {
    if (!f?.thought) return;
    let n = 0;
    const id = setInterval(() => { n += 2; setTyped(f.thought.slice(0, n)); if (n >= f.thought.length) clearInterval(id); }, 22);
    return () => clearInterval(id);
  }, [f?.thought, i]);

  if (!data || !f) {
    return <div className="rounded-md border border-dashed border-line-1 p-4 text-center text-[12px] text-text-2">The agentic browser opens here when Sous delegates a web task.<div className="pt-1 font-mono text-[10px] text-text-3">e.g. read Spoonacular pricing</div></div>;
  }
  const pos = phase === "idle" ? f.from : f.cursor;
  const navigating = i > 0 && frames[i - 1].url !== f.url && phase === "idle";
  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-hidden rounded-lg border border-line-1 bg-bg-1">
        <div className="flex items-center gap-2 border-b border-line-1 bg-bg-2 px-2 py-1.5">
          <span className="flex gap-1" aria-hidden><i className="size-2 rounded-full bg-danger/60" /><i className="size-2 rounded-full bg-warn/60" /><i className="size-2 rounded-full bg-accent/60" /></span>
          <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md border border-line-1 bg-bg-0 px-2 py-1 text-[11px] text-text-2">
            <LockIcon className="size-3 shrink-0 text-accent" aria-hidden />
            <span className="truncate font-mono">{f.url.replace(/^https?:\/\//, "")}</span>
            {navigating && <span className="live-pulse ml-auto text-[10px] text-accent">loading…</span>}
          </div>
          <span className="flex items-center gap-1 rounded-md border border-accent/40 bg-accent-dim px-1.5 py-0.5 text-[10px] text-accent"><SparklesIcon className="size-3" aria-hidden />Sous</span>
        </div>
        <div className="relative aspect-[1280/800] w-full overflow-hidden bg-bg-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/browser/${task}/${f.n}.jpg`} alt={`page at ${f.url}`} className="absolute inset-0 size-full object-cover" />
          {f.action === "extract" && phase === "acting" && (
            <div className="settle absolute inset-x-[6%] top-[22%] bottom-[18%] rounded-md border-2 border-accent bg-accent-dim" aria-hidden>
              <span className="absolute -top-5 left-0 rounded bg-accent px-1.5 py-0.5 font-mono text-[9px] text-bg-0">extract · {f.key ?? "page_text"}</span>
            </div>
          )}
          <div aria-hidden className="pointer-events-none absolute z-10 transition-[left,top] duration-[1000ms] ease-in-out" style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%` }}>
            <MousePointer2Icon className="size-5 -translate-x-0.5 -translate-y-0.5 fill-accent text-bg-0 drop-shadow" />
            {phase === "acting" && f.action === "click" && <span className="absolute -left-3 -top-3 size-8 animate-ping rounded-full border-2 border-accent" />}
          </div>
        </div>
      </div>
      <div className="rounded-md border border-line-1 bg-bg-1 px-2.5 py-2 text-[12px]">
        <div className="flex items-center gap-2 text-[10px] text-text-3">
          <GlobeIcon className="size-3" aria-hidden /><span className="tnum">step {Math.min(i + 1, frames.length)}/{frames.length}</span>
          <span className={cn("rounded border px-1 font-mono uppercase", f.action === "done" ? "border-accent/40 text-accent" : "border-line-1 text-text-2")}>{f.action}</span>
          <span className="ml-auto rounded border border-warn/40 bg-warn-dim px-1 text-warn">REPLAY · recorded run</span>
        </div>
        <p className={cn("min-h-5 pt-1 text-text-1", playing && "caret")}>{typed || f.thought}</p>
        {f.result && <p className="pt-1 text-[11px] text-text-2">{f.result}</p>}
      </div>
    </div>
  );
}
