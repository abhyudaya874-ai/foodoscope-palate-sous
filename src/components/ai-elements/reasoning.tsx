"use client";
// Official pattern: Reasoning (https://ui.shadcn.com/docs/ai-elements/base/reasoning.md)
// Built on the vendored official Trace component. Text streams in with a typewriter while `running`.
import * as React from "react";
import { CircleCheckIcon, LoaderCircleIcon } from "lucide-react";
import { Trace, TraceCollapsible, TraceCollapsibleContent, TraceCollapsibleTrigger, TraceDescription, TraceIcon, TraceLine, TraceTitle } from "@/components/ui/trace";
import { cn } from "@/lib/utils";

function useTypewriter(text: string, enabled: boolean) {
  const [n, setN] = React.useState(0);
  React.useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => setN((v) => (v < text.length ? Math.min(text.length, v + 2) : v)), 18);
    return () => clearInterval(id);
  }, [text, enabled]);
  return enabled ? text.slice(0, n) : text;
}

export function Reasoning({ text, running, label }: { text: string; running: boolean; label?: string }) {
  const [open, setOpen] = React.useState<boolean | undefined>(undefined);
  const shown = useTypewriter(text, running);
  const line = (
    <TraceLine status={running ? "running" : undefined}>
      <TraceIcon>{running ? <LoaderCircleIcon className="animate-spin" /> : <CircleCheckIcon />}</TraceIcon>
      <TraceTitle>{running ? "Thinking" : "Thought"}</TraceTitle>
      {label && <TraceDescription className="font-mono text-[10px]">{label}</TraceDescription>}
    </TraceLine>
  );
  if (!text) return <Trace>{line}</Trace>;
  return (
    <Trace>
      <TraceCollapsible open={open ?? running} onOpenChange={setOpen}>
        <TraceCollapsibleTrigger>{line}</TraceCollapsibleTrigger>
        <TraceCollapsibleContent className={cn("whitespace-pre-wrap text-[13px] leading-5 text-text-2", running && "caret")}>
          {shown}
        </TraceCollapsibleContent>
      </TraceCollapsible>
    </Trace>
  );
}

/** One agent step row (Task pattern): icon + plain label + model badge + latency + tokens. */
export function StepRow({
  label, running, ok, badge, latencyMs, tokens, children,
}: {
  label: string; running?: boolean; ok?: boolean; badge?: string; latencyMs?: number; tokens?: number; children?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState<boolean | undefined>(undefined);
  const status = running ? ("running" as const) : ok === false ? ("error" as const) : undefined;
  return (
    <TraceCollapsible open={open ?? false} onOpenChange={setOpen}>
      <TraceCollapsibleTrigger>
        <TraceLine status={status} className={cn(running && "live-pulse")}>
          <TraceIcon>{running ? <LoaderCircleIcon className="animate-spin" /> : <CircleCheckIcon className={ok === false ? "text-danger" : "text-accent"} />}</TraceIcon>
          <TraceTitle>{label}</TraceTitle>
          {badge && <TraceDescription className="font-mono text-[10px]">{badge}</TraceDescription>}
          {latencyMs !== undefined && latencyMs > 0 && <TraceDescription className="tnum">{latencyMs}ms</TraceDescription>}
          {tokens !== undefined && tokens > 0 && <TraceDescription className="tnum">{tokens} tok</TraceDescription>}
        </TraceLine>
      </TraceCollapsibleTrigger>
      {children && <TraceCollapsibleContent className="text-[12px] text-text-2">{children}</TraceCollapsibleContent>}
    </TraceCollapsible>
  );
}
