"use client";
import { useRef, useState } from "react";
import { FileTreePane } from "@/components/workspace/FileTreePane";
import { DiffPane } from "@/components/workspace/DiffPane";
import { CsvPane } from "@/components/workspace/CsvPane";
import { TerminalPane } from "@/components/workspace/TerminalPane";
import { TestsPane, type TestResult } from "@/components/workspace/TestsPane";

interface Patch { path: string; before: string; after: string; status?: string }
interface State {
  files: Set<string>;
  patches: Patch[];
  csvs: Map<string, { before: string; after: string }>;
  terminal: string[];
  tests: TestResult[];
  xp: number;
  budget: string;
}

type Msg = { seq: number; ts: string; type: string; data: Record<string, unknown> };

export default function DevWorkspace() {
  const [state, setState] = useState<State>({ files: new Set(), patches: [], csvs: new Map(), terminal: [], tests: [], xp: 0, budget: "" });
  const [speed, setSpeed] = useState(2);
  const [running, setRunning] = useState(false);
  const [activeFile, setActiveFile] = useState<string>();
  const esRef = useRef<EventSource | null>(null);

  function apply(m: Msg) {
    setState((s) => {
      const d = m.data as Record<string, unknown>;
      switch (m.type) {
        case "file.patch": {
          const p = d as unknown as Patch;
          return { ...s, files: new Set(s.files).add(p.path), patches: [...s.patches, p] };
        }
        case "csv.upsert": {
          const c = new Map(s.csvs);
          const prev = c.get(String(d.path));
          c.set(String(d.path), { before: prev?.after ?? "", after: String(d.text ?? prev?.after ?? "") });
          return { ...s, csvs: c };
        }
        case "probe": {
          return { ...s, terminal: [...s.terminal, `$ ${d.method} ${d.endpoint} → ${d.status} (${d.latencyMs}ms)`] };
        }
        case "test.result": {
          const t = d as { suite?: string; passed?: number; failed?: number; bugId?: string };
          const name = t.suite ?? (t.bugId ? `fix ${t.bugId}` : "tests");
          const fail = (t.failed ?? 0) > 0;
          const row: TestResult = { name, status: fail ? "fail" : "pass", detail: `${t.passed ?? 0}✓ ${t.failed ?? 0}✗` };
          const rest = s.tests.filter((x) => x.name !== name);
          return { ...s, tests: [...rest, row] };
        }
        case "budget":
          return { ...s, budget: `${d.kind}: ${d.used}/${d.cap}` };
        case "xp":
          return { ...s, xp: s.xp + Number(d.amount ?? 0) };
        case "tool.start":
          return { ...s, terminal: [...s.terminal, `▶ ${String(d.tool ?? d.event ?? "tool")}`] };
        default:
          return s;
      }
    });
  }

  async function play() {
    esRef.current?.close();
    setState({ files: new Set(), patches: [], csvs: new Map(), terminal: [], tests: [], xp: 0, budget: "" });
    setRunning(true);
    const res = await fetch("/api/run", { method: "POST", body: JSON.stringify({ speed }) });
    const { runId } = (await res.json()) as { runId: string };
    const es = new EventSource(`/api/run/${runId}/stream`);
    esRef.current = es;
    for (const t of ["plan", "reasoning.delta", "text.delta", "tool.start", "tool.end", "file.patch", "csv.upsert", "test.result", "budget", "xp", "probe", "done"]) {
      es.addEventListener(t, (e) => {
        const m = JSON.parse((e as MessageEvent).data) as Msg;
        apply(m);
        if (m.type === "done") { es.close(); setRunning(false); }
      });
    }
  }

  const csvEntries = [...state.csvs.entries()];
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <button onClick={play} disabled={running} className="px-3 py-1.5 rounded bg-emerald-600 text-white text-sm disabled:opacity-40" aria-label="play replay">
          {running ? "playing…" : "▶ play replay"}
        </button>
        <label className="text-xs text-zinc-500 flex items-center gap-2">
          speed
          <input type="range" min={1} max={10} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} aria-label="replay speed" />
          {speed}×
        </label>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">REPLAY</span>
        <span className="ml-auto text-xs text-zinc-500">{state.budget}</span>
        <span className="text-xs text-emerald-400">XP {state.xp}</span>
      </div>
      <div className="grid grid-cols-4 gap-3">
        <div className="border border-zinc-800 rounded">
          <div className="px-3 py-1.5 text-xs text-zinc-500 border-b border-zinc-800">Files</div>
          <FileTreePane files={[...state.files]} active={activeFile} onSelect={setActiveFile} />
        </div>
        <div className="col-span-3 space-y-3">
          <div>
            <div className="text-xs text-zinc-500 pb-1">Diff</div>
            <DiffPane patches={activeFile ? state.patches.filter((p) => p.path === activeFile) : state.patches} />
          </div>
          <div>
            <div className="text-xs text-zinc-500 pb-1">CSV</div>
            {csvEntries.map(([p, v]) => <CsvPane key={p} path={p} before={v.before} after={v.after} />)}
            {csvEntries.length === 0 && <div className="text-zinc-600 text-xs">no csv changes</div>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-zinc-500 pb-1">Terminal</div>
              <TerminalPane lines={state.terminal} />
            </div>
            <div>
              <div className="text-xs text-zinc-500 pb-1">Tests</div>
              <TestsPane results={state.tests} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
