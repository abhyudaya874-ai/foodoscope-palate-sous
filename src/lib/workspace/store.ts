import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { applyPatch, structuredPatch } from "diff";
import { upsertCsv } from "./csv";
import type { EventBus } from "../events/log";

export class WorkspaceContractError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "WorkspaceContractError";
  }
}

export interface FilePatch {
  path: string;
  before: string;
  after: string;
  added: number;
  removed: number;
  status: "proposed" | "applied" | "denied";
  version: number;
}

export interface PushChannel {
  push(type: string, data: unknown): void;
}

const WRITE_ROOTS = ["workspace", "fixtures", "events"];

export class WorkspaceStore {
  private versions = new Map<string, { version: number; content: string }[]>();
  private checkpoints = new Map<string, Map<string, string>>();
  constructor(
    private root = process.cwd(),
    private bus?: EventBus,
    private chan?: PushChannel,
  ) {}

  guard(rel: string): string {
    if (path.isAbsolute(rel) || rel.includes("..") || rel.includes("\0"))
      throw new WorkspaceContractError(`path rejected: ${rel}`);
    const top = rel.split(/[\\/]/)[0];
    if (!WRITE_ROOTS.includes(top)) throw new WorkspaceContractError(`write outside allowed roots: ${rel}`);
    const abs = path.resolve(this.root, rel);
    if (!abs.startsWith(path.resolve(this.root) + path.sep)) throw new WorkspaceContractError(`escape: ${rel}`);
    return abs;
  }

  read(rel: string): string {
    const abs = this.guard(rel);
    return existsSync(abs) ? readFileSync(abs, "utf8") : "";
  }

  version(rel: string): number {
    const v = this.versions.get(rel);
    return v ? v[v.length - 1].version : 0;
  }

  private atomicWrite(abs: string, content: string) {
    mkdirSync(path.dirname(abs), { recursive: true });
    const tmp = `${abs}.tmp-${process.pid}`;
    writeFileSync(tmp, content);
    renameSync(tmp, abs);
  }

  private diffStats(before: string, after: string) {
    const p = structuredPatch("a", "b", before, after, "", "", { context: 0 });
    let added = 0, removed = 0;
    for (const h of p.hunks) for (const l of h.lines) {
      if (l.startsWith("+")) added++;
      else if (l.startsWith("-")) removed++;
    }
    return { added, removed };
  }

  private commit(rel: string, after: string, needsConfirmation: boolean, approved: boolean): FilePatch {
    const before = this.read(rel);
    const { added, removed } = this.diffStats(before, after);
    if (before === after) {
      const fp: FilePatch = { path: rel, before, after, added: 0, removed: 0, status: "applied", version: this.version(rel) };
      this.chan?.push("file.patch", fp);
      return fp; // idempotent no-op
    }
    this.bus?.emit("patch.proposed", "system", { path: rel, diffStats: { added, removed }, needsConfirmation });
    const fp: FilePatch = { path: rel, before, after, added, removed, status: "proposed", version: this.version(rel) + 1 };
    this.chan?.push("file.patch", fp);
    if (needsConfirmation && !approved) {
      this.chan?.push("file.patch", { ...fp, status: "denied" });
      return { ...fp, status: "denied" };
    }
    this.atomicWrite(this.guard(rel), after);
    const hist = this.versions.get(rel) ?? [];
    hist.push({ version: hist.length ? hist[hist.length - 1].version + 1 : 1, content: after });
    this.versions.set(rel, hist);
    this.bus?.emit("patch.applied", "system", { path: rel, approved });
    this.chan?.push("file.patch", { ...fp, status: "applied" });
    return { ...fp, status: "applied" };
  }

  write(rel: string, content: string, opts: { needsConfirmation?: boolean; approved?: boolean } = {}): FilePatch {
    return this.commit(rel, content, opts.needsConfirmation ?? false, opts.approved ?? true);
  }

  patch(rel: string, unifiedDiff: string, opts: { needsConfirmation?: boolean; approved?: boolean } = {}): FilePatch {
    const before = this.read(rel);
    const after = applyPatch(before, unifiedDiff);
    if (after === false) {
      if (this.alreadyApplied(before, unifiedDiff)) {
        const fp: FilePatch = { path: rel, before, after: before, added: 0, removed: 0, status: "applied", version: this.version(rel) };
        this.chan?.push("file.patch", fp);
        return fp;
      }
      throw new WorkspaceContractError(`patch does not apply to ${rel}`);
    }
    return this.commit(rel, after, opts.needsConfirmation ?? false, opts.approved ?? true);
  }

  private alreadyApplied(before: string, unifiedDiff: string): boolean {
    const reverse = unifiedDiff
      .split("\n")
      .map((l) => (l.startsWith("+") && !l.startsWith("+++") ? "-" + l.slice(1) : l.startsWith("-") && !l.startsWith("---") ? "+" + l.slice(1) : l))
      .join("\n");
    return applyPatch(before, reverse) !== false;
  }

  csvUpsert(rel: string, rows: string[][], keyCol = 0, opts: { needsConfirmation?: boolean; approved?: boolean } = {}) {
    const res = upsertCsv(this.read(rel), rows, keyCol);
    const fp = this.commit(rel, res.text, opts.needsConfirmation ?? false, opts.approved ?? true);
    this.chan?.push("csv.upsert", { path: rel, added: res.added, updated: res.updated, rows: res.rows });
    return { ...res, patch: fp };
  }

  checkpoint(id = `cp-${Date.now().toString(36)}`): string {
    const snap = new Map<string, string>();
    for (const [rel, hist] of this.versions) snap.set(rel, hist[hist.length - 1].content);
    this.checkpoints.set(id, snap);
    this.chan?.push("checkpoint", { id });
    return id;
  }

  restore(id: string): string[] {
    const snap = this.checkpoints.get(id);
    if (!snap) throw new WorkspaceContractError(`no checkpoint ${id}`);
    const restored: string[] = [];
    for (const [rel, content] of snap) {
      const cur = this.read(rel);
      if (cur !== content) {
        this.atomicWrite(this.guard(rel), content);
        const hist = this.versions.get(rel) ?? [];
        hist.push({ version: hist.length ? hist[hist.length - 1].version + 1 : 1, content });
        this.versions.set(rel, hist);
        restored.push(rel);
      }
    }
    this.chan?.push("checkpoint.restore", { id, restored });
    return restored;
  }

  history(rel: string) {
    return this.versions.get(rel) ?? [];
  }
}
