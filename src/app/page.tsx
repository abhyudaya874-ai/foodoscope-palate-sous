"use client";
import { useMemo, useState } from "react";
import { useRunStream } from "@/lib/ui/useRunStream";
import { mapEvents, type ViewItem } from "@/lib/ui/eventToView";
import { MessageScroller, Message, Reasoning, StackTrace, Shimmer } from "@/components/ai-elements/text";
import { Tool } from "@/components/ai-elements/tooling";
import { Plan, Queue, Confirmation } from "@/components/ai-elements/flow";
import { AnswerCard } from "@/components/ai-elements/answer";
import { PromptInput, ModelSelector, ContextBar } from "@/components/ai-elements/input";
import { FileTreePane } from "@/components/workspace/FileTreePane";
import { DiffPane } from "@/components/workspace/DiffPane";
import { CsvPane } from "@/components/workspace/CsvPane";
import { TerminalPane } from "@/components/workspace/TerminalPane";
import { TestsPane, type TestResult } from "@/components/workspace/TestsPane";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { deriveSous } from "@/lib/gamification/derive";

const TABS = ["Plan", "Files", "Diff", "CSV", "Terminal", "Tests", "Profile"] as const;

export default function Home() {
  const { messages, running, play } = useRunStream();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Plan");
  const items = useMemo(() => mapEvents(messages), [messages]);

  const patches = items.filter((i) => i.kind === "patch");
  const csvs = items.filter((i) => i.kind === "csv");
  const probes = items.filter((i) => i.kind === "probe");
  const tests: TestResult[] = items.filter((i) => i.kind === "test").map((i) => ({ name: i.title, status: i.ok ? "pass" : "fail", detail: i.detail }));
  const lastLlm = [...items].reverse().find((i) => i.badge);
  const lastBudget = [...items].reverse().find((i) => i.kind === "budget");
  const reasoning = items.filter((i) => i.kind === "reasoning").map((i) => i.detail).join("\n");
  const plans = items.find((i) => i.kind === "plan");
  const planSteps = ((plans?.data.steps as { kind: string; endpoint?: string }[] | undefined) ?? []).map((s) => ({
    id: s.kind, label: s.endpoint ? `probe ${s.endpoint}` : s.kind,
    status: "done" as const, // replayed plan; live status comes from tool.start/end mapping later
  }));
  const confirms = items.filter((i) => i.kind === "confirm");
  const xpTotal = items.filter((i) => i.kind === "xp").reduce((a, i) => a + Number((i.data as { amount?: number }).amount ?? 0), 0);
  const sous = useMemo(() => deriveSous(messages), [messages]);

  const answer = items.length === 0
    ? "Sous is an autonomous agent that probes the Foodoscope APIs, verifies contract drift, and ships fixes — with every claim backed by a recorded event."
    : `Run complete: ${probes.length} endpoints probed, ${items.filter((i) => i.kind === "test").length} test phases, +${xpTotal} XP derived from the event log.`;

  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-zinc-200">
      <header className="flex items-center gap-3 border-b border-zinc-800 px-4 py-2">
        <span className="text-sm font-semibold">Palate <span className="text-emerald-400">+</span> Sous</span>
        <ModelSelector provider={lastLlm?.badge?.split("/")[0]} model={lastLlm?.badge?.split("/")[1]} effort="low" />
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">REPLAY</span>
        <div className="ml-auto flex items-center gap-4">
          <ContextBar used={Number(lastBudget?.data.used ?? 0)} cap={Number(lastBudget?.data.cap ?? 40)} label="tools" />
          <button onClick={() => play(4)} disabled={running} className="rounded bg-emerald-700 px-3 py-1 text-xs text-white disabled:opacity-40" aria-label="run replay">
            {running ? "running…" : "▶ replay demo"}
          </button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-56 shrink-0 border-r border-zinc-800 p-3 md:block">
          <div className="pb-2 text-[10px] uppercase tracking-wider text-zinc-600">Sous #1</div>
          <ProfileCard profile={sous} mini />
          <div className="pt-4"><Queue left={0} doneCount={items.filter((i) => i.ok).length} /></div>
        </aside>
        <main className="flex min-w-0 flex-1 flex-col">
          <MessageScroller>
            {items.length === 0 && <Shimmer lines={2} />}
            {reasoning && <Reasoning text={reasoning} streaming={running} />}
            {planSteps.length > 0 && <Plan steps={planSteps} />}
            {items.filter((i) => ["tool", "probe", "test", "patch", "csv", "xp"].includes(i.kind)).map((i) => (
              <Tool key={i.seq} title={i.title} badge={i.badge} latencyMs={i.latencyMs} tokens={i.tokens} detail={i.detail} ok={i.ok} />
            ))}
            {items.filter((i) => i.kind === "error").map((i) => (
              <StackTrace key={i.seq} error={i.detail ?? "error"} />
            ))}
            {confirms.map((i) => (
              <Confirmation key={i.seq} path={i.detail ?? ""} state={running ? "pending" : "approved"} />
            ))}
            {!running && items.length > 0 && (
              <Message from="assistant">
                <AnswerCard
                  text={answer}
                  sources={probes.map((p) => ({ title: p.title, detail: p.detail, url: String((p.data as { fixture?: string }).fixture ?? "") }))}
                  suggestions={["show the crosswalk", "what's confirmed?", "open the bug report"]}
                  onSuggestion={(s) => setTab(s.includes("crosswalk") ? "CSV" : s.includes("report") ? "Files" : "Tests")}
                />
              </Message>
            )}
          </MessageScroller>
          <footer className="border-t border-zinc-800 p-3">
            <PromptInput onSend={() => play(4)} disabled={running} />
          </footer>
        </main>
        <section className="hidden w-[420px] shrink-0 border-l border-zinc-800 lg:flex lg:flex-col">
          <nav className="flex gap-1 border-b border-zinc-800 px-2 pt-2" aria-label="workspace tabs">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`rounded-t px-2.5 py-1.5 text-xs ${tab === t ? "bg-zinc-900 text-emerald-300" : "text-zinc-500 hover:text-zinc-300"}`}>
                {t}
              </button>
            ))}
          </nav>
          <div className="flex-1 overflow-y-auto p-2">
            {tab === "Plan" && <Plan steps={planSteps} />}
            {tab === "Files" && <FileTreePane files={patches.map((p) => p.title)} onSelect={() => setTab("Diff")} />}
            {tab === "Diff" && <DiffPane patches={patches.map((p) => ({ path: p.title, before: String(p.data.before ?? ""), after: String(p.data.after ?? ""), status: String(p.data.status ?? "") }))} />}
            {tab === "CSV" && csvs.map((c) => <CsvPane key={c.seq} path={c.title} before="" after={String((c.data as { text?: string }).text ?? "")} />)}
            {tab === "Terminal" && <TerminalPane lines={probes.map((p) => `$ GET ${p.title} → ${String((p.data as { status?: number }).status ?? "")}`)} />}
            {tab === "Tests" && <TestsPane results={tests} />}
            {tab === "Profile" && <ProfileCard profile={sous} />}
          </div>
        </section>
      </div>
    </div>
  );
}
