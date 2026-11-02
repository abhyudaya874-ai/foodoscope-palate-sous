"use client";
// Shell presentation components: Hero (idle), TopBar, RailCard, RightPane. Tokens only.
import * as React from "react";
import { ArrowUpRightIcon, FlameIcon, SparklesIcon } from "lucide-react";
import { PromptInput, Context, type ComposerMode } from "@/components/ai-elements/prompt-input";
import { ModelSelector, ReasoningLevel, ModeSwitch, type Health } from "@/components/ai-elements/model-selector";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { Queue } from "@/components/ai-elements/plan";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-8", className)} fill="none">
      <path d="M12 3c-3 4-7 5.5-7 10a7 7 0 0 0 14 0c0-4.5-4-6-7-10Z" stroke="var(--accent)" strokeWidth="1.5" />
      <path d="M12 8v9" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" opacity=".5" />
    </svg>
  );
}

/** Idle hero (Perplexity): logo, headline, one large composer with mode pills, quiet goal chips. */
export function Hero({ onGoal, running, modes, mode, onMode, modelLabel }: {
  onGoal: (g: string) => void; running: boolean; modes: ComposerMode[]; mode: string; onMode: (m: string) => void; modelLabel?: string;
}) {
  const [value, setValue] = React.useState("");
  const chips = [
    "Dinner from what I have — budget ₹300, no peanuts",
    "What pairs with cardamom besides dessert?",
    "I'm out of jeera — what substitutes?",
    "Fix the crosswalk for my ingredient CSV",
  ];
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6">
      <div className="settle flex w-full max-w-[680px] flex-col items-center gap-6 pb-16">
        <LogoMark className="size-10" />
        <h1 className="text-center text-[34px] font-normal tracking-tight text-text-1">What should Sous cook up?</h1>
        <div className="settle-2 w-full">
          <PromptInput big value={value} onChange={setValue} onSend={() => onGoal(value)} running={running} placeholder="Give Sous a goal…" modes={modes} mode={mode} onMode={onMode} modelLabel={modelLabel} />
        </div>
        <div className="settle-3 flex w-full flex-col items-start gap-0.5 px-1">
          {chips.map((c, i) => (
            <button key={c} onClick={() => onGoal(c)} style={{ animationDelay: `${300 + i * 70}ms` }}
              className="slide-in group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[14px] text-text-2 transition-colors hover:bg-bg-1 hover:text-text-1">
              <ArrowUpRightIcon className="size-3.5 text-text-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent" />{c}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Top bar: brand + one labelled status cluster + one primary action. */
export function TopBar({ provider, model, health, latencyMs, effort, onEffort, mode, onMode, toolsUsed, toolsCap, onRun, running }: {
  provider?: string; model?: string; health: Health; latencyMs?: number;
  effort: "low" | "medium" | "high"; onEffort: (v: "low" | "medium" | "high") => void;
  mode: "live" | "replay"; onMode: (m: "live" | "replay") => void;
  toolsUsed: number; toolsCap: number; onRun: () => void; running: boolean;
}) {
  return (
    <header className="flex items-center gap-3 border-b border-line-1 bg-bg-0 px-4 py-2">
      <ModelSelector provider={provider} model={model} health={health} latencyMs={latencyMs} />
      <ReasoningLevel value={effort} onChange={onEffort} />
      <ModeSwitch mode={mode} onChange={onMode} />
      <div className="ml-auto flex items-center gap-3">
        <Context used={toolsUsed} cap={toolsCap} label="tools" />
        <button onClick={onRun} disabled={running}
          className="rounded-md bg-accent px-3 py-1.5 text-[12px] font-medium text-bg-0 hover:brightness-110 disabled:opacity-40">
          {running ? "running…" : mode === "replay" ? "▶ Watch a replay" : "▶ Run live"}
        </button>
      </div>
    </header>
  );
}

/** Left rail: identity card — name on its own line, rank chip BELOW, XP bar, streak, badges. */
export function RailCard({ profile, queueLeft, queueDone }: {
  profile: ReturnType<typeof import("@/lib/gamification/derive").deriveSous>;
  queueLeft: number; queueDone: number;
}) {
  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="overflow-hidden rounded-lg border border-line-1 bg-bg-1" style={{ boxShadow: "var(--raise)" }}>
        <div className="h-14 bg-gradient-to-r from-emerald-900/60 via-bg-2 to-teal-900/40" aria-hidden />
        <div className="-mt-6 flex flex-col gap-2 p-3">
          <div className="grid size-10 place-items-center rounded-full border-2 border-accent bg-bg-2 text-[15px] font-semibold text-accent" aria-hidden>S</div>
          <div className="flex flex-col gap-1">
            <span className="text-[13px] font-semibold text-text-1">Sous #1</span>
            <span className="w-fit rounded border border-accent/40 bg-accent-dim px-1.5 py-0.5 text-[10px] font-medium text-accent">{profile.rank}</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-text-2">
            <span className="tnum">{profile.xp} XP</span>
            <span className="tnum text-text-3">{Math.max(0, profile.nextRankAt - profile.xp)} to {profile.nextRankName}</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-bg-2" role="progressbar" aria-valuenow={profile.xp} aria-valuemax={profile.nextRankAt} aria-label="XP to next rank">
            <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${Math.min(100, (profile.xp / Math.max(1, profile.nextRankAt)) * 100)}%` }} />
          </div>
          <div className="flex items-center justify-between pt-0.5">
            <span className="flex items-center gap-1 text-[10px] text-warn"><FlameIcon className="size-3" aria-hidden /><span className="tnum">{profile.streak}d</span></span>
            <span className="flex gap-1" aria-label="badges">
              {profile.badges.slice(0, 3).map((b) => (
                <span key={b.name} title={b.name} className="grid size-5 place-items-center rounded-full border border-line-1 bg-bg-2 text-[9px] text-accent" aria-label={b.name}>{b.name[0]}</span>
              ))}
              {profile.badges.length === 0 && <span className="text-[10px] text-text-3">no badges yet</span>}
            </span>
          </div>
        </div>
      </div>
      <Queue left={queueLeft} doneCount={queueDone} />
    </div>
  );
}

export { SparklesIcon };
