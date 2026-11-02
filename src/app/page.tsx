"use client";
import { useMemo, useState } from "react";
import { useRunStream } from "@/lib/ui/useRunStream";
import { mapEvents } from "@/lib/ui/eventToView";
import { Chat, Message, ChainOfThought, FileTree } from "@/components/ai-elements/chat";
import { Reasoning, StepRow } from "@/components/ai-elements/reasoning";
import { Plan } from "@/components/ai-elements/plan";
import { Sources, InlineCitation } from "@/components/ai-elements/sources";
import { Tool, Terminal, TestResults, StackTrace, Confirmation, EmptyHint, type TestRow } from "@/components/ai-elements/tool";
import { PromptInput } from "@/components/ai-elements/prompt-input";
import { Hero, TopBar, RailCard } from "@/components/shell/chrome";
import { prettyTitle } from "@/components/ai-elements/adapters";
import { DiffCard } from "@/components/shell/diff-card";
import { CsvCard } from "@/components/shell/csv-card";
import { deriveSous } from "@/lib/gamification/derive";
import { planStepsFrom, sourcesFrom, testRowsFrom, terminalLinesFrom, lastProvider } from "@/components/ai-elements/adapters";
import type { Health } from "@/components/ai-elements/model-selector";
import { cn } from "@/lib/utils";

const RIGHT_TABS = ["Plan", "Changes", "Terminal", "Tests"] as const;
type RightTab = (typeof RIGHT_TABS)[number];

export default function Home() {
  const { messages, running, play, stop } = useRunStream();
  const [tab, setTab] = useState<RightTab>("Plan");
  const [effort, setEffort] = useState<"low" | "medium" | "high">("low");
  const [mode, setMode] = useState<"live" | "replay">("replay");
  const [goal, setGoal] = useState("");
  const items = useMemo(() => mapEvents(messages), [messages]);

  const patches = items.filter((i) => i.kind === "patch");
  const csvs = items.filter((i) => i.kind === "csv");
  const probes = items.filter((i) => i.kind === "probe");
  const tests: TestRow[] = testRowsFrom(items);
  const reasoning = items.filter((i) => i.kind === "reasoning").map((i) => i.detail).join("\n");
  const planSteps = planStepsFrom(items);
  const sources = sourcesFrom(items);
  const lines = terminalLinesFrom(items);
  const provider = lastProvider(items);
  const health: Health = provider.provider ? "ok" : "none";
  const toolsUsed = items.filter((i) => ["tool", "probe", "test"].includes(i.kind)).length;
  const xpTotal = items.filter((i) => i.kind === "xp").reduce((a, i) => a + Number((i.data as { amount?: number }).amount ?? 0), 0);
  const sous = useMemo(() => deriveSous(messages), [messages]);
  const hasRun = items.length > 0;

  const answer = hasRun
    ? `Run complete: ${probes.length} endpoints probed, ${tests.length} test rows, +${xpTotal} XP derived from the event log.`
    : "";

  return (
    <div className="flex h-screen flex-col bg-bg-0 text-text-1">
      <TopBar
        provider={provider.provider} model={provider.model} health={health} latencyMs={provider.latencyMs}
        effort={effort} onEffort={setEffort} mode={mode} onMode={setMode}
        toolsUsed={toolsUsed} toolsCap={40} onRun={() => play(4)} running={running}
      />
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-60 shrink-0 border-r border-line-1 bg-bg-0 md:block" aria-label="Sous profile">
          <RailCard profile={sous} queueLeft={Math.max(0, planSteps.filter((s) => s.status === "pending").length)} queueDone={planSteps.filter((s) => s.status === "done").length} />
        </aside>

        <main className="flex min-w-0 flex-1 flex-col" aria-label="conversation">
          {!hasRun && !running ? (
            <Hero onGoal={(g) => { setGoal(g); play(4); }} onReplay={() => play(4)} running={running} />
          ) : (
            <>
              <Chat streaming={running}>
                {reasoning && <Reasoning text={reasoning} running={running} />}
                {planSteps.length > 0 && (
                  <ChainOfThought count={planSteps.length} running={running}>
                    <Plan steps={planSteps} />
                  </ChainOfThought>
                )}
                {items
                  .filter((i) => ["tool", "probe", "test", "patch", "csv"].includes(i.kind))
                  .filter((i) => !String(i.detail ?? "").startsWith('{"tool"'))
                  .filter((i, idx, arr) => arr.findIndex((x) => prettyTitle(x.title) === prettyTitle(i.title) && x.kind === i.kind) === idx || i.kind === "test")
                  .map((i) => (
                    <StepRow key={i.seq} label={prettyTitle(i.title)} badge={i.badge} latencyMs={i.latencyMs} tokens={i.tokens} ok={i.ok} running={i.kind === "tool" && i.ok === undefined}>
                      <span className="font-mono text-[10px]">{i.detail}</span>
                    </StepRow>
                  ))}
                {items.filter((i) => i.kind === "error").map((i) => (
                  <StackTrace key={i.seq} error={i.detail ?? "error"} hint="Check the Terminal tab for the failing command." />
                ))}
                {items.filter((i) => i.kind === "confirm").map((i) => (
                  <Confirmation key={i.seq} summary={i.detail ?? ""} state={running ? "pending" : "approved"} />
                ))}
                {!running && hasRun && (
                  <Message from="assistant">
                    <div className="settle flex flex-col gap-2">
                      <p className="text-[14px] leading-6 text-text-1">
                        {answer.split(/(\[\d+\])/).map((part, i) =>
                          /^\[\d+\]$/.test(part) ? <InlineCitation key={i} n={Number(part.slice(1, -1))} /> : <span key={i}>{part}</span>,
                        )}
                      </p>
                      <div className="settle-2 flex items-center gap-2">
                        <Sources rows={sources} />
                        <span className="text-[11px] text-text-3">copy · regenerate · 👍 👎</span>
                      </div>
                      <div className="settle-3 flex flex-wrap gap-2">
                        {["show the crosswalk", "what's confirmed?", "open the bug report"].map((s) => (
                          <button key={s} onClick={() => setTab(s.includes("crosswalk") ? "Changes" : s.includes("report") ? "Changes" : "Tests")}
                            className="rounded-md border border-line-1 bg-bg-1 px-2.5 py-1.5 text-[12px] text-text-2 hover:border-accent hover:text-text-1">
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </Message>
                )}
              </Chat>
              <footer className="border-t border-line-1 p-3">
                <div className="mx-auto max-w-3xl">
                  <PromptInput value={goal} onChange={setGoal} onSend={() => play(4)} onStop={stop} running={running} placeholder="Give Sous a goal…" />
                </div>
              </footer>
            </>
          )}
        </main>

        <section className="hidden w-[400px] shrink-0 flex-col border-l border-line-1 bg-bg-0 lg:flex" aria-label="workspace">
          <nav className="flex gap-1 border-b border-line-1 px-2 py-1.5" aria-label="workspace tabs">
            {RIGHT_TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)} aria-current={tab === t}
                className={cn("rounded-md px-2.5 py-1 text-[12px]", tab === t ? "bg-accent-dim text-accent" : "text-text-3 hover:text-text-2")}>
                {t}
              </button>
            ))}
          </nav>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {tab === "Plan" && (planSteps.length ? <Plan steps={planSteps} /> : <EmptyHint text="Plan appears when a run starts." example="press ▶ Watch a replay" />)}
            {tab === "Changes" && (
              <div className="flex flex-col gap-2">
                <FileTree files={patches.map((p) => ({ path: p.title }))} />
                {patches.map((p) => <DiffCard key={p.seq} title={p.title} before={String(p.data.before ?? "")} after={String(p.data.after ?? "")} />)}
                {csvs.map((c) => <CsvCard key={c.seq} path={c.title} text={String((c.data as { text?: string }).text ?? "")} />)}
                {!patches.length && !csvs.length && <EmptyHint text="Files, diffs and CSV changes appear here while Sous works." example="workspace/data/crosswalk.csv" />}
              </div>
            )}
            {tab === "Terminal" && <Terminal lines={lines} />}
            {tab === "Tests" && <TestResults rows={tests} />}
          </div>
        </section>
      </div>
    </div>
  );
}
