"use client";
// Perplexity-style thread: goal title -> collapsible Steps (thinking, plan, tool rows) -> test card -> answer -> sources.
import { CopyIcon, RefreshCwIcon, ThumbsDownIcon, ThumbsUpIcon } from "lucide-react";
import type { ViewItem } from "@/lib/ui/eventToView";
import type { Thinking } from "@/lib/ui/useThinking";
import { ChainOfThought, Message } from "@/components/ai-elements/chat";
import { Reasoning, StepRow } from "@/components/ai-elements/reasoning";
import { Plan, type PlanStep } from "@/components/ai-elements/plan";
import { Sources, InlineCitation, type SourceRow } from "@/components/ai-elements/sources";
import { Confirmation, StackTrace, Subagent, TestRunCard } from "@/components/ai-elements/tool";
import { prettyTitle, testRunsFrom } from "@/components/ai-elements/adapters";

const ICONS = [
  ["copy answer", CopyIcon], ["regenerate", RefreshCwIcon], ["helpful", ThumbsUpIcon], ["not helpful", ThumbsDownIcon],
] as const;

export function Thread({ goal, thinking, items, planSteps, running, finished, durationMs, answer, sources, openSrc, onOpenSrc, onRelated, browser }: {
  goal: string; thinking: Thinking; items: ViewItem[]; planSteps: PlanStep[]; running: boolean; finished: boolean; durationMs?: number;
  answer: string; sources: SourceRow[]; openSrc: number | null; onOpenSrc: (n: number) => void; onRelated: (s: string) => void;
  browser: { i: number; total: number; thought: string; done: boolean } | null;
}) {
  const narration = items.filter((i) => i.kind === "reasoning").map((i) => i.detail).join("\n");
  const rows = items
    .filter((i) => ["tool", "probe", "patch", "csv"].includes(i.kind))
    .filter((i) => !String(i.detail ?? "").startsWith('{"tool"'))
    .filter((i, idx, arr) => arr.findIndex((x) => prettyTitle(x.title) === prettyTitle(i.title) && x.kind === i.kind) === idx);
  const tests = testRunsFrom(items);
  const live = thinking.status === "streaming" || running;
  return (
    <>
      <h1 className="text-[22px] font-medium leading-7 tracking-tight text-text-1">{goal}</h1>
      <ChainOfThought count={rows.length + (thinking.reasoning ? 1 : 0)} durationMs={durationMs} running={live}>
        <div className="flex flex-col gap-2">
          {(thinking.reasoning || thinking.status === "streaming") && (
            <Reasoning text={thinking.reasoning || thinking.text} running={thinking.status === "streaming"}
              label={thinking.provider ? `${thinking.provider}/${thinking.model?.split("/").pop()} · live${thinking.ms ? ` · ${(thinking.ms / 1000).toFixed(1)}s` : ""}` : undefined} />
          )}
          {narration && <Reasoning text={narration} running={running} label="Sous narration · replay" />}
          {planSteps.length > 0 && <Plan steps={planSteps} />}
          {rows.map((i) => (
            <StepRow key={i.seq} label={prettyTitle(i.title)} badge={i.badge} latencyMs={i.latencyMs} tokens={i.tokens} ok={i.ok}>
              <span className="font-mono text-[10px]">{i.detail}</span>
            </StepRow>
          ))}
        </div>
      </ChainOfThought>
      {browser && <Subagent title={`Browser agent · step ${Math.min(browser.i + 1, browser.total)}/${browser.total}`} status={browser.done ? "done" : "running"} detail={browser.thought} />}
      {tests.map((t) => <TestRunCard key={t.suite} {...t} />)}
      {items.filter((i) => i.kind === "error").map((i) => <StackTrace key={i.seq} error={i.detail ?? "error"} hint="Open the Terminal tab for the failing call." />)}
      {items.filter((i) => i.kind === "confirm").map((i) => <Confirmation key={i.seq} summary={`Write ${i.detail ?? "file"}`} state={running ? "pending" : "approved"} />)}
      {finished && (
        <Message from="assistant">
          <div className="settle flex flex-col gap-3">
            <p className="text-[15px] leading-7 text-text-1">
              {answer.split(/(\[\d+\])/).map((part, i) =>
                /^\[\d+\]$/.test(part) ? <InlineCitation key={i} n={Number(part.slice(1, -1))} onOpen={onOpenSrc} /> : <span key={i}>{part}</span>)}
            </p>
            <div className="settle-2 flex items-center gap-2">
              <Sources rows={sources} openSignal={openSrc} />
              <div className="ml-auto flex items-center gap-0.5">
                {ICONS.map(([label, Icon]) => (
                  <button key={label} aria-label={label} className="grid size-7 place-items-center rounded-md text-text-3 hover:bg-bg-2 hover:text-text-1"><Icon className="size-3.5" /></button>
                ))}
              </div>
            </div>
            <div className="settle-3 flex flex-col gap-1 border-t border-line-1 pt-2">
              <span className="text-[11px] uppercase tracking-wider text-text-3">Related</span>
              {["Show the crosswalk changes", "Which bugs are confirmed?", "Open the bug report"].map((s) => (
                <button key={s} onClick={() => onRelated(s)} className="w-fit text-left text-[13px] text-text-2 hover:text-accent">+ {s}</button>
              ))}
            </div>
          </div>
        </Message>
      )}
    </>
  );
}
