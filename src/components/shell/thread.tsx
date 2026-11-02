"use client";
// Perplexity thread (Answer / Links tabs, Steps with search sources, serif streamed answer, hover citations)
// + Devin cards (command, inline diff, test results).
import * as React from "react";
import { CopyIcon, GlobeIcon, RefreshCwIcon, ThumbsDownIcon, ThumbsUpIcon } from "lucide-react";
import type { ViewItem } from "@/lib/ui/eventToView";
import type { Thinking } from "@/lib/ui/useThinking";
import { ChainOfThought, Message } from "@/components/ai-elements/chat";
import { Reasoning, StepRow } from "@/components/ai-elements/reasoning";
import { Plan, type PlanStep } from "@/components/ai-elements/plan";
import { Sources, InlineCitation, type SourceRow } from "@/components/ai-elements/sources";
import { CommandCard, Confirmation, StackTrace, Subagent, TestRunCard } from "@/components/ai-elements/tool";
import { DiffCard } from "@/components/shell/diff-card";
import { prettyTitle, testRunsFrom, terminalLinesFrom, type Change } from "@/components/ai-elements/adapters";
import { cn } from "@/lib/utils";

const ACTIONS = [["copy answer", CopyIcon], ["regenerate", RefreshCwIcon], ["helpful", ThumbsUpIcon], ["not helpful", ThumbsDownIcon]] as const;
const host = (u?: string) => { try { return u ? new URL(u).hostname.replace(/^www\./, "") : ""; } catch { return ""; } };

/** Streams the answer word by word (fade + de-blur); citation chips pop in as they are reached. */
function StreamedAnswer({ text, rows, onOpen }: { text: string; rows: SourceRow[]; onOpen: (n: number) => void }) {
  const tokens = React.useMemo(() => text.split(/(\s+|\[\d+\])/).filter(Boolean), [text]);
  const [n, setN] = React.useState(0);
  const [prev, setPrev] = React.useState(text);
  if (prev !== text) { setPrev(text); setN(0); }
  React.useEffect(() => {
    const id = setInterval(() => setN((v) => (v < tokens.length ? v + 1 : v)), 22);
    return () => clearInterval(id);
  }, [tokens.length]);
  return (
    <p className="font-answer text-[17px] leading-8 text-text-1">
      {tokens.slice(0, n).map((t, i) => {
        const m = /^\[(\d+)\]$/.exec(t);
        return m ? <InlineCitation key={i} n={Number(m[1])} row={rows.find((r) => r.n === Number(m[1]))} onOpen={onOpen} /> : <span key={i} className="word-in">{t}</span>;
      })}
      {n < tokens.length && <span className="caret" aria-hidden />}
    </p>
  );
}

export function Thread({ goal, thinking, items, planSteps, running, finished, durationMs, answer, sources, webCount, changes, openSrc, onOpenSrc, onRelated, browser }: {
  goal: string; thinking: Thinking; items: ViewItem[]; planSteps: PlanStep[]; running: boolean; finished: boolean; durationMs?: number;
  answer: string; sources: SourceRow[]; webCount: number; changes: Change[]; openSrc: number | null; onOpenSrc: (n: number) => void; onRelated: (s: string) => void;
  browser: { i: number; total: number; thought: string; done: boolean } | null;
}) {
  const [view, setView] = React.useState<"answer" | "links">("answer");
  const narration = items.filter((i) => i.kind === "reasoning").map((i) => i.detail).join("\n");
  const rows = items.filter((i) => ["tool", "patch", "csv"].includes(i.kind))
    .filter((i) => !String(i.detail ?? "").startsWith('{"tool"'))
    .filter((i, idx, arr) => arr.findIndex((x) => prettyTitle(x.title) === prettyTitle(i.title) && x.kind === i.kind) === idx);
  const probeLines = terminalLinesFrom(items);
  const tests = testRunsFrom(items);
  const web = sources.filter((s) => ["tavily", "exa", "browser"].includes(s.provider ?? ""));
  const live = thinking.status === "streaming" || running;
  return (
    <>
      <h1 className="font-answer text-[26px] font-normal leading-9 tracking-tight text-text-1">{goal}</h1>
      <div role="tablist" aria-label="view" className="flex gap-5 border-b border-line-1">
        {([["answer", "Answer"], ["links", `Links · ${sources.length}`]] as const).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={view === id} onClick={() => setView(id)}
            className={cn("-mb-px border-b-2 pb-2 text-[13px] transition-colors duration-200", view === id ? "border-text-1 text-text-1" : "border-transparent text-text-3 hover:text-text-2")}>{label}</button>
        ))}
      </div>

      {view === "links" ? (
        <ul className="flex flex-col gap-1">
          {sources.map((s, i) => (
            <li key={s.n} style={{ animationDelay: `${Math.min(i, 14) * 30}ms` }} className="slide-in rounded-lg px-3 py-2 hover:bg-bg-1">
              <div className="flex items-center gap-2 text-[11px] text-text-3"><GlobeIcon className="size-3" />{host(s.url) || "recorded fixture"}<span className="font-mono uppercase">{s.provider}</span></div>
              {s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-[14px] text-text-1 hover:text-accent hover:underline">{s.title}</a> : <span className="text-[14px] text-text-1">{s.title}</span>}
              {s.detail && <p className="line-clamp-2 text-[12px] text-text-3">{s.detail}</p>}
            </li>
          ))}
        </ul>
      ) : (
        <>
          <ChainOfThought count={rows.length + (thinking.reasoning ? 1 : 0) + (web.length ? 1 : 0)} durationMs={durationMs} running={live}>
            <div className="flex flex-col gap-2.5">
              {(thinking.reasoning || thinking.status === "streaming") && (
                <Reasoning text={thinking.reasoning || thinking.text} running={thinking.status === "streaming"}
                  label={thinking.provider ? `${thinking.provider}/${thinking.model?.split("/").pop()} · live${thinking.ms ? ` · ${(thinking.ms / 1000).toFixed(1)}s` : ""}` : undefined} />
              )}
              {narration && <Reasoning text={narration} running={running} label="Sous narration · replay" />}
              {planSteps.length > 0 && <Plan steps={planSteps} />}
              {probeLines.length > 0 && <CommandCard title="curl, jq" lines={probeLines} />}
              {finished && web.length > 0 && (
                <div className="slide-in flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-[13px] text-text-1"><GlobeIcon className="size-3.5 text-text-3" />Searched the web — {webCount} receipts (Tavily · Exa · browser)</div>
                  <ul className="ml-1.5 flex flex-col border-l border-line-1 pl-3">
                    {web.slice(0, 5).map((s, i) => (
                      <li key={s.n} style={{ animationDelay: `${i * 70}ms` }} className="slide-in flex items-center gap-2 py-0.5 text-[12px]">
                        <span className="grid size-4 place-items-center rounded border border-line-1 bg-bg-2 font-mono text-[8px] uppercase text-text-2">{(host(s.url) || "?")[0]}</span>
                        <span className="min-w-0 flex-1 truncate text-text-2">{s.title}</span><span className="shrink-0 text-[10px] text-text-3">{host(s.url)}</span>
                      </li>
                    ))}
                    {web.length > 5 && <li className="py-0.5 text-[11px] text-text-3">+{web.length - 5} more in Links</li>}
                  </ul>
                </div>
              )}
              {rows.map((i, idx) => (
                <div key={i.seq} style={{ animationDelay: `${idx * 40}ms` }} className="slide-in">
                  <StepRow label={prettyTitle(i.title)} badge={i.badge} latencyMs={i.latencyMs} tokens={i.tokens} ok={i.ok}><span className="font-mono text-[10px]">{i.detail}</span></StepRow>
                </div>
              ))}
            </div>
          </ChainOfThought>
          {browser && <Subagent title={`Browser agent · step ${Math.min(browser.i + 1, browser.total)}/${browser.total}`} status={browser.done ? "done" : "running"} detail={browser.thought} />}
          {changes.map((c, i) => (
            <div key={c.path} style={{ animationDelay: `${i * 80}ms` }} className="slide-in">
              <DiffCard title={c.path} before={c.before} after={c.after} added={c.added} removed={c.removed} unchanged={c.unchanged} lines={c.lines} />
            </div>
          ))}
          {tests.map((t) => <div key={t.suite} className="settle"><TestRunCard {...t} /></div>)}
          {items.filter((i) => i.kind === "error").map((i) => <StackTrace key={i.seq} error={i.detail ?? "error"} hint="Open the Terminal tab for the failing call." />)}
          {items.filter((i) => i.kind === "confirm").map((i) => <Confirmation key={i.seq} summary={`Write ${i.detail ?? "file"}`} state={running ? "pending" : "approved"} />)}
          {finished && (
            <Message from="assistant">
              <div className="settle flex flex-col gap-4">
                <StreamedAnswer text={answer} rows={sources} onOpen={onOpenSrc} />
                <div className="settle-2 flex items-center gap-2">
                  <Sources rows={sources} openSignal={openSrc} />
                  <div className="ml-auto flex items-center gap-0.5">
                    {ACTIONS.map(([label, Icon]) => <button key={label} aria-label={label} className="grid size-8 place-items-center rounded-lg text-text-3 transition-colors hover:bg-bg-2 hover:text-text-1"><Icon className="size-4" /></button>)}
                  </div>
                </div>
                <div className="settle-3 flex flex-col gap-0.5 border-t border-line-1 pt-3">
                  <span className="pb-1 text-[11px] uppercase tracking-wider text-text-3">Related</span>
                  {["Show the crosswalk changes", "Which bugs are confirmed?", "Open the bug report"].map((s) => (
                    <button key={s} onClick={() => onRelated(s)} className="w-fit rounded-md py-1 text-left text-[14px] text-text-2 transition-all hover:translate-x-0.5 hover:text-accent">+ {s}</button>
                  ))}
                </div>
              </div>
            </Message>
          )}
        </>
      )}
    </>
  );
}
