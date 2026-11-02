"use client";
import { useEffect, useMemo, useState } from "react";
import { useRunStream } from "@/lib/ui/useRunStream";
import { useThinking } from "@/lib/ui/useThinking";
import { mapEvents } from "@/lib/ui/eventToView";
import { Chat } from "@/components/ai-elements/chat";
import { FileTree } from "@/components/ai-elements/chat";
import { Plan } from "@/components/ai-elements/plan";
import { Terminal, TestRunCard, EmptyHint } from "@/components/ai-elements/tool";
import { PromptInput } from "@/components/ai-elements/prompt-input";
import type { SourceRow } from "@/components/ai-elements/sources";
import { Hero, TopBar, RailCard } from "@/components/shell/chrome";
import { Thread } from "@/components/shell/thread";
import { BrowserPane } from "@/components/shell/browser-pane";
import { DiffCard } from "@/components/shell/diff-card";
import { CsvCard } from "@/components/shell/csv-card";
import { deriveSous } from "@/lib/gamification/derive";
import { planStepsFrom, sourcesFrom, terminalLinesFrom, lastProvider, changesFrom, testRunsFrom } from "@/components/ai-elements/adapters";
import type { Health } from "@/components/ai-elements/model-selector";
import { cn } from "@/lib/utils";

const TABS = ["Plan", "Changes", "Terminal", "Tests", "Browser"] as const;
type Tab = (typeof TABS)[number];
const DEFAULT_GOAL = "Probe the Foodoscope API, detect contract issues and ship verified fixes";

export default function Home() {
  const { messages, running, play, stop } = useRunStream();
  const { thinking, think } = useThinking();
  const [pinned, setPinned] = useState<Tab | null>(null);
  const [effort, setEffort] = useState<"low" | "medium" | "high">("low");
  const [mode, setMode] = useState<"live" | "replay">("replay");
  const [draft, setDraft] = useState("");
  const [goal, setGoal] = useState("");
  const [runNo, setRunNo] = useState(0);
  const [openSrc, setOpenSrc] = useState<number | null>(null);
  const [webSources, setWebSources] = useState<SourceRow[]>([]);
  const [providerInfo, setProviderInfo] = useState<{ available?: string }>({});
  const [browser, setBrowser] = useState<{ i: number; total: number; thought: string; done: boolean } | null>(null);
  const items = useMemo(() => mapEvents(messages), [messages]);

  useEffect(() => {
    fetch("/api/providers").then((r) => r.json()).then(setProviderInfo).catch(() => {});
    fetch("/api/sources").then((r) => r.json()).then((d) => setWebSources(d.rows ?? [])).catch(() => {});
  }, []);

  const submit = async (text: string) => {
    const g = text.trim() || DEFAULT_GOAL;
    setGoal(g); setDraft(""); setPinned(null); setBrowser(null); setRunNo((n) => n + 1);
    await think(g);          // real model thinking streams first (free provider)
    play(1);                 // then the recorded tool run, paced
  };

  const probes = items.filter((i) => i.kind === "probe");
  const planSteps = planStepsFrom(items);
  const probeSources = sourcesFrom(items);
  const sources = [...probeSources, ...webSources.map((r) => ({ ...r, n: probeSources.length + r.n }))];
  const changes = changesFrom(items);
  const testRuns = testRunsFrom(items);
  const provider = lastProvider(items);
  const shownProvider = thinking.provider ?? provider.provider ?? providerInfo.available;
  const health: Health = shownProvider ? "ok" : "none";
  const toolsUsed = items.filter((i) => ["tool", "probe", "test"].includes(i.kind)).length;
  const sous = useMemo(() => deriveSous(messages), [messages]);
  const replayDone = messages.some((m) => m.type === "done");
  const busy = thinking.status === "streaming" || running;
  const hasRun = thinking.status !== "idle" || items.length > 0;
  const t0 = messages[0] ? Date.parse(messages[0].ts) : 0;
  const t1 = messages.length ? Date.parse(messages[messages.length - 1].ts) : 0;
  const durationMs = (thinking.ms ?? 0) + (t1 > t0 ? t1 - t0 : 0);

  const last = [...items].reverse().find((i) => ["patch", "csv", "test", "probe", "plan"].includes(i.kind));
  const follow: Tab = replayDone ? "Browser" : last?.kind === "test" ? "Tests" : last?.kind === "probe" ? "Terminal" : last?.kind === "patch" || last?.kind === "csv" ? "Changes" : "Plan";
  const tab = pinned ?? follow;

  const bugs = sous.stats.bugsFound, fixed = sous.stats.fixesVerified;
  const t = testRuns[0];
  const answer = replayDone
    ? `Sous probed ${probes.length} Foodoscope endpoints [1][2], confirmed ${bugs} contract bugs and verified ${fixed} fixes with a failing→passing test${t?.before && t.after ? ` (${t.before.passed} passed / ${t.before.failed} failed → ${t.after.passed} passed / ${t.after.failed} failed)` : ""}. The crosswalk and a mail-ready bug report were written to workspace/. ${webSources.length} live web receipts from Tavily, Exa and the browser agent back the rival and claim checks [${probeSources.length + 1}].`
    : "";

  return (
    <div className="flex h-screen flex-col bg-bg-0 text-text-1">
      <TopBar provider={shownProvider} model={thinking.model ?? provider.model} health={health} latencyMs={provider.latencyMs}
        effort={effort} onEffort={setEffort} mode={mode} onMode={setMode}
        toolsUsed={toolsUsed} toolsCap={40} onRun={() => submit(goal || DEFAULT_GOAL)} running={busy} />
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-60 shrink-0 border-r border-line-1 bg-bg-0 md:block" aria-label="Sous profile">
          <RailCard profile={sous} queueLeft={planSteps.filter((s) => s.status === "pending").length} queueDone={planSteps.filter((s) => s.status === "done").length} />
        </aside>
        <div className="flex items-center gap-2 border-b border-line-1 px-3 py-1.5 md:hidden" aria-label="Sous profile compact">
          <span className="grid size-6 place-items-center rounded-full border border-accent bg-bg-2 text-[11px] font-semibold text-accent" aria-hidden>S</span>
          <span className="text-[12px] font-medium">Sous #1</span>
          <span className="rounded border border-accent/40 bg-accent-dim px-1.5 py-0.5 text-[10px] text-accent">{sous.rank}</span>
          <span className="tnum ml-auto text-[10px] text-text-2">{sous.xp} XP · {sous.streak}d streak</span>
        </div>

        <main className="flex min-w-0 flex-1 flex-col" aria-label="conversation">
          {!hasRun ? (
            <Hero onGoal={(g) => submit(g)} onReplay={() => submit(DEFAULT_GOAL)} running={busy} />
          ) : (
            <>
              <Chat streaming={busy}>
                <Thread goal={goal} thinking={thinking} items={items} planSteps={planSteps} running={running} finished={replayDone}
                  durationMs={durationMs} answer={answer} sources={sources} openSrc={openSrc} onOpenSrc={(n) => setOpenSrc(n)}
                  onRelated={(s) => setPinned(s.includes("crosswalk") || s.includes("report") ? "Changes" : "Tests")} browser={browser} />
              </Chat>
              <footer className="border-t border-line-1 p-3">
                <div className="mx-auto max-w-3xl">
                  <PromptInput value={draft} onChange={setDraft} onSend={() => submit(draft)} onStop={stop} running={busy} placeholder="Ask a follow-up or give Sous a new goal…" />
                </div>
              </footer>
            </>
          )}
        </main>

        <section className={cn("hidden shrink-0 flex-col border-l border-line-1 bg-bg-0 transition-[width] duration-300 lg:flex", tab === "Browser" ? "w-[560px]" : "w-[400px]")} aria-label="workspace">
          <nav className="flex gap-1 border-b border-line-1 px-2 py-1.5" aria-label="workspace tabs">
            {TABS.map((x) => (
              <button key={x} onClick={() => setPinned(x)} aria-current={tab === x}
                className={cn("relative rounded-md px-2.5 py-1 text-[12px]", tab === x ? "bg-accent-dim text-accent" : "text-text-3 hover:text-text-2")}>
                {x}
                {tab === x && busy && !pinned && <span className="live-pulse absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-accent" aria-label="following live" />}
              </button>
            ))}
            {pinned && <button onClick={() => setPinned(null)} className="ml-auto text-[10px] text-text-3 hover:text-accent" title="resume auto-follow">follow live</button>}
          </nav>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
            {tab === "Plan" && (planSteps.length ? <Plan steps={planSteps} /> : <EmptyHint text="Live plan cards appear when a run starts." example="give Sous a goal" />)}
            {tab === "Changes" && (
              <div className="flex flex-col gap-2">
                <FileTree files={changes.map((c) => ({ path: c.path, added: c.unchanged ? undefined : c.added, removed: c.unchanged ? undefined : c.removed }))} />
                {changes.map((c) => c.path.endsWith(".csv")
                  ? <CsvCard key={c.path} path={c.path} before={c.before} after={c.after} />
                  : <DiffCard key={c.path} title={c.path} before={c.before} after={c.after} added={c.added} removed={c.removed} unchanged={c.unchanged} lines={c.lines} />)}
              </div>
            )}
            {tab === "Terminal" && <Terminal lines={terminalLinesFrom(items)} />}
            {tab === "Tests" && (testRuns.length ? <div className="flex flex-col gap-2">{testRuns.map((r) => <TestRunCard key={r.suite} {...r} />)}</div> : <EmptyHint text="Contract tests appear here — they fail before the shim, pass after." example="workspace/tests/contract.test.ts" />)}
            {tab === "Browser" && <BrowserPane task="rival" playKey={replayDone ? runNo : 0} onStep={(i, total, f) => setBrowser({ i, total, thought: f.thought, done: i >= total - 1 })} />}
          </div>
        </section>
      </div>
    </div>
  );
}
