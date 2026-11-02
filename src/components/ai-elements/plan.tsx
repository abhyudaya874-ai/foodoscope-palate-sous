"use client";
// Official patterns: Plan + Queue (https://ui.shadcn.com/docs/ai-elements/base/plan.md)
import { CircleCheckIcon, CircleDashed, LoaderCircleIcon, CircleAlertIcon } from "lucide-react";
import { Trace, TraceLine, TraceIcon, TraceTitle, TraceDescription } from "@/components/ui/trace";
import { cn } from "@/lib/utils";

export type PlanStepStatus = "pending" | "running" | "done" | "failed";
export interface PlanStep { id: string; label: string; status: PlanStepStatus; detail?: string }

const ICON: Record<PlanStepStatus, React.ReactNode> = {
  pending: <CircleDashed className="text-text-3" />,
  running: <LoaderCircleIcon className="animate-spin text-accent" />,
  done: <CircleCheckIcon className="text-accent" />,
  failed: <CircleAlertIcon className="text-danger" />,
};

/** Plan: all steps known up-front, title shows "N of M done". */
export function Plan({ steps, title }: { steps: PlanStep[]; title?: string }) {
  const done = steps.filter((s) => s.status === "done").length;
  return (
    <Trace>
      <TraceLine>
        <TraceTitle className="text-[13px] text-text-1">{title ?? `Plan · ${done} of ${steps.length} done`}</TraceTitle>
      </TraceLine>
      <div className="ml-1 flex flex-col gap-0.5 border-l border-line-1 pl-3">
        {steps.map((s, i) => (
          <div key={s.id} className="relative flex items-center gap-2 py-0.5 text-[12px]">
            {i > 0 && <span aria-hidden className="absolute -left-[13px] top-[-6px] h-[10px] w-px bg-line-1" />}
            {ICON[s.status]}
            <span className={cn(s.status === "pending" ? "text-text-3" : "text-text-1", s.status === "running" && "live-pulse")}>{s.label}</span>
            {s.detail && <span className="truncate font-mono text-[10px] text-text-3">{s.detail}</span>}
          </div>
        ))}
      </div>
    </Trace>
  );
}

/** Queue: remaining vs completed in the left rail. */
export function Queue({ left, doneCount }: { left: number; doneCount: number }) {
  return (
    <div className="flex items-center justify-between text-[11px] text-text-2">
      <span className="uppercase tracking-wider text-text-3">Queue</span>
      <span className="tnum">{doneCount} done · {left} left</span>
    </div>
  );
}
