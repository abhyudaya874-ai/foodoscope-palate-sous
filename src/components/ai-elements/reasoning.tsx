"use client";
// Official pattern: Reasoning (https://ui.shadcn.com/docs/ai-elements/base/reasoning.md)
// Built on the vendored official Trace component; wired to our event stream via adapters.
import * as React from "react";
import { CircleCheckIcon, LoaderCircleIcon } from "lucide-react";
import { Trace, TraceCollapsible, TraceCollapsibleContent, TraceCollapsibleTrigger, TraceIcon, TraceLine, TraceTitle, TraceDescription } from "@/components/ui/trace";
import { cn } from "@/lib/utils";

export function Reasoning({ text, running, durationMs }: { text: string; running: boolean; durationMs?: number }) {
  const [open, setOpen] = React.useState<boolean | undefined>(undefined);
  const line = (
    <TraceLine status={running ? "running" : undefined}>
      <TraceIcon>{running ? <LoaderCircleIcon className="animate-spin" /> : <CircleCheckIcon />}</TraceIcon>
      <TraceTitle>{running ? "Thinking" : "Thought"}</TraceTitle>
      {durationMs !== undefined && <TraceDescription>{(durationMs / 1000).toFixed(1)}s</TraceDescription>}
    </TraceLine>
  );
  if (!text) return <Trace>{line}</Trace>;
  return (
    <Trace>
      <TraceCollapsible open={open ?? running} onOpenChange={setOpen}>
        <TraceCollapsibleTrigger>{line}</TraceCollapsibleTrigger>
        <TraceCollapsibleContent className="whitespace-pre-wrap text-[13px] text-text-2">{text}</TraceCollapsibleContent>
      </TraceCollapsible>
    </Trace>
  );
}

/** One agent step row (Task pattern): icon + plain label + model badge + latency + tokens. */
export function StepRow({
  label, running, ok, badge, latencyMs, tokens, children, defaultOpen,
}: {
  label: string; running?: boolean; ok?: boolean; badge?: string; latencyMs?: number; tokens?: number;
  children?: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState<boolean | undefined>(defaultOpen);
  const status = running ? ("running" as const) : ok === false ? ("error" as const) : undefined;
  return (
    <TraceCollapsible open={open ?? running} onOpenChange={setOpen}>
      <TraceCollapsibleTrigger>
        <TraceLine status={status} className={cn(running && "live-pulse")}>
          <TraceIcon>{running ? <LoaderCircleIcon className="animate-spin" /> : ok === false ? <CircleCheckIcon className="text-danger" /> : <CircleCheckIcon className="text-accent" />}</TraceIcon>
          <TraceTitle>{label}</TraceTitle>
          {badge && <TraceDescription className="font-mono text-[10px]">{badge}</TraceDescription>}
          {latencyMs !== undefined && <TraceDescription className="tnum">{latencyMs}ms</TraceDescription>}
          {tokens !== undefined && tokens > 0 && <TraceDescription className="tnum">{tokens} tok</TraceDescription>}
        </TraceLine>
      </TraceCollapsibleTrigger>
      {children && <TraceCollapsibleContent className="text-[12px] text-text-2">{children}</TraceCollapsibleContent>}
    </TraceCollapsible>
  );
}
