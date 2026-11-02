import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { WorkspaceStore, WorkspaceContractError } from "./store";
import { parseCsv, serializeCsv, upsertCsv } from "./csv";

let dir: string;
let store: WorkspaceStore;
let pushed: { type: string; data: unknown }[];

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), "ws-"));
  mkdirSync(path.join(dir, "workspace"), { recursive: true });
  pushed = [];
  store = new WorkspaceStore(dir, undefined, { push: (t, d) => pushed.push({ type: t, data: d }) });
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe("path guard", () => {
  it("rejects ../, absolute, and non-workspace roots", () => {
    for (const bad of ["../x", "workspace/../evil/x", "/abs/x", "src/x.ts", "package.json"])
      expect(() => store.write(bad, "y")).toThrow(WorkspaceContractError);
  });
  it("accepts workspace/, fixtures/, events/ paths", () => {
    for (const ok of ["workspace/a.txt", "fixtures/f.json", "events/e.jsonl"])
      expect(store.write(ok, "y").status).toBe("applied");
  });
});

describe("write + patch", () => {
  it("is atomic and idempotent on identical content", () => {
    store.write("workspace/a.txt", "one\n");
    const again = store.write("workspace/a.txt", "one\n");
    expect(again.added).toBe(0);
    expect(store.version("workspace/a.txt")).toBe(1);
  });
  it("applies a unified diff and double-apply is a no-op", () => {
    store.write("workspace/b.txt", "l1\nl2\nl3\n");
    const diff = `--- a/b.txt\n+++ b/b.txt\n@@ -1,3 +1,3 @@\n l1\n-l2\n+l2b\n l3\n`;
    const p1 = store.patch("workspace/b.txt", diff);
    expect(p1.status).toBe("applied");
    expect(readFileSync(path.join(dir, "workspace/b.txt"), "utf8")).toContain("l2b");
    const p2 = store.patch("workspace/b.txt", diff);
    expect(p2.added + p2.removed).toBe(0);
  });
});

describe("csv", () => {
  it("round-trips quoted fields", () => {
    const rows = [["a", "b"], ['x,"y"', 'z"q"']];
    expect(parseCsv(serializeCsv(rows))).toEqual(rows);
  });
  it("upserts by key column", () => {
    const res = upsertCsv("k,v\na,1\n", [["a", "2"], ["b", "3"]]);
    expect(res.added).toBe(1);
    expect(res.updated).toBe(1);
    expect(res.rows).toBe(2);
    expect(res.text).toContain("a,2");
  });
});

describe("checkpoint/restore", () => {
  it("restores previous content", () => {
    store.write("workspace/c.txt", "v1");
    const cp = store.checkpoint("cp1");
    store.write("workspace/c.txt", "v2");
    expect(store.read("workspace/c.txt")).toBe("v2");
    store.restore(cp);
    expect(store.read("workspace/c.txt")).toBe("v1");
    expect(store.restore("cp1")).toEqual([]);
  });
});

describe("confirmation gate", () => {
  it("denies sponsor-facing writes without approval", () => {
    const fp = store.write("workspace/data/crosswalk.csv", "a,b\n", { needsConfirmation: true, approved: false });
    expect(fp.status).toBe("denied");
    expect(existsSync(path.join(dir, "workspace/data/crosswalk.csv"))).toBe(false);
  });
});
