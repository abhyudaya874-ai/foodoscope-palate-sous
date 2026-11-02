import { z } from "zod";
import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import type { EventBus } from "../events/log";
import type { PushChannel, WorkspaceStore } from "../workspace/store";
import type { FoodoscopeClient, ProbeResult } from "../foodoscope/client";
import type { Budget } from "../llm/budget";
import { classify } from "../llm/gateway";

const exec = promisify(execFile);

export interface ToolCtx {
  bus: EventBus;
  chan: PushChannel;
  store: WorkspaceStore;
  client: FoodoscopeClient;
  budget: Budget;
  autoApprove?: boolean;
}

export class ToolError extends Error {
  constructor(msg: string, public kind: "transient" | "contract" | "auth" | "budget") {
    super(msg);
    this.name = "ToolError";
  }
}

export const probeInput = z.object({ path: z.string(), params: z.record(z.string(), z.string()).optional() });
export const writeInput = z.object({ path: z.string(), content: z.string() });
export const patchInput = z.object({ path: z.string(), diff: z.string() });
export const csvInput = z.object({ path: z.string(), rows: z.array(z.array(z.string())), keyCol: z.number().int().min(0).default(0) });
export const testInput = z.object({ suite: z.string(), env: z.record(z.string(), z.string()).optional() });
export const reportInput = z.object({ path: z.string(), markdown: z.string(), bugId: z.string().optional() });

const SPONSOR_FACING = /^workspace\/(data|reports)\//;

async function guard<T>(ctx: ToolCtx, fn: () => Promise<T> | T): Promise<T> {
  try {
    ctx.budget.takeTool();
    return await fn();
  } catch (e) {
    const kind = classify(e);
    ctx.chan.push("tool.error", { message: e instanceof Error ? e.message : String(e), kind });
    throw e instanceof ToolError ? e : new ToolError(e instanceof Error ? e.message : String(e), kind);
  }
}

export const tools = {
  async "probe.endpoint"(ctx: ToolCtx, input: z.infer<typeof probeInput>): Promise<ProbeResult> {
    const args = probeInput.parse(input);
    return guard(ctx, async () => {
      ctx.chan.push("tool.start", { tool: "probe.endpoint", endpoint: args.path });
      const r = await ctx.client.get(args.path, args.params);
      ctx.bus.emit("probe.call", "system", {
        endpoint: args.path, method: "GET", status: r.status, latencyMs: r.latencyMs,
        fixture: r.fixture, replay: r.replay, tokensSpent: 1,
      }, r.fixture);
      ctx.chan.push("probe", { endpoint: args.path, method: "GET", status: r.status, latencyMs: r.latencyMs, replay: r.replay, fixture: r.fixture });
      return r;
    });
  },

  async "fs.write"(ctx: ToolCtx, input: z.infer<typeof writeInput>) {
    const args = writeInput.parse(input);
    return guard(ctx, async () => {
      const needs = SPONSOR_FACING.test(args.path);
      if (needs) ctx.chan.push("confirm.request", { path: args.path });
      return ctx.store.write(args.path, args.content, { needsConfirmation: needs, approved: needs ? (ctx.autoApprove ?? false) : true });
    });
  },

  async "fs.patch"(ctx: ToolCtx, input: z.infer<typeof patchInput>) {
    const args = patchInput.parse(input);
    return guard(ctx, async () => {
      const needs = SPONSOR_FACING.test(args.path);
      if (needs) ctx.chan.push("confirm.request", { path: args.path });
      return ctx.store.patch(args.path, args.diff, { needsConfirmation: needs, approved: needs ? (ctx.autoApprove ?? false) : true });
    });
  },

  async "csv.upsert"(ctx: ToolCtx, input: z.infer<typeof csvInput>) {
    const args = csvInput.parse(input);
    return guard(ctx, async () => {
      const needs = SPONSOR_FACING.test(args.path);
      if (needs) ctx.chan.push("confirm.request", { path: args.path });
      return ctx.store.csvUpsert(args.path, args.rows, args.keyCol, { needsConfirmation: needs, approved: needs ? (ctx.autoApprove ?? false) : true });
    });
  },

  async "test.run"(ctx: ToolCtx, input: z.infer<typeof testInput>) {
    const args = testInput.parse(input);
    return guard(ctx, async () => {
      ctx.chan.push("tool.start", { tool: "test.run", suite: args.suite });
      try {
        const { stdout } = await exec("pnpm", ["vitest", "run", args.suite], {
          cwd: process.cwd(), env: { ...process.env, ...(args.env ?? {}) }, timeout: 120_000,
        });
        const { passed, failed } = parseVitest(stdout);
        ctx.bus.emit("test.run", "system", { suite: args.suite, passed, failed, phase: "standalone" });
        ctx.chan.push("test.result", { suite: args.suite, passed, failed });
        return { passed, failed, ok: failed === 0 };
      } catch (e) {
        const stdout = (e as { stdout?: string }).stdout ?? "";
        const { passed, failed } = parseVitest(stdout);
        ctx.bus.emit("test.run", "system", { suite: args.suite, passed, failed, phase: "standalone" });
        ctx.chan.push("test.result", { suite: args.suite, passed, failed });
        return { passed, failed, ok: false };
      }
    });
  },

  async "report.draft"(ctx: ToolCtx, input: z.infer<typeof reportInput>) {
    const args = reportInput.parse(input);
    return guard(ctx, async () => {
      ctx.chan.push("confirm.request", { path: args.path });
      const fp = ctx.store.write(args.path, args.markdown, { needsConfirmation: true, approved: ctx.autoApprove ?? false });
      ctx.bus.emit("report.drafted", "system", { path: args.path, bugId: args.bugId, approved: fp.status === "applied" }, args.path);
      return fp;
    });
  },

  async "budget.check"(ctx: ToolCtx) {
    return guard(ctx, () => ({
      apiCalls: `${ctx.budget.apiCalls}/${ctx.budget.cfg.maxApiCalls}`,
      toolCalls: `${ctx.budget.toolCalls}/${ctx.budget.cfg.maxToolCallsPerRun}`,
      llmTokens: `${ctx.budget.llmTokens}/${ctx.budget.cfg.maxLlmTokensPerRun}`,
      wallet: `${ctx.budget.walletSpent}/${ctx.budget.cfg.foodoscopeTokenWallet}`,
    }));
  },
};

function parseVitest(out: string): { passed: number; failed: number } {
  const m = out.match(/Tests\s+(\d+)\s*passed?|(\d+)\s+passed.*?(\d+)\s+failed/i);
  const p = out.match(/(\d+)\s+passed/i);
  const f = out.match(/(\d+)\s+failed/i);
  void m;
  return { passed: p ? Number(p[1]) : 0, failed: f ? Number(f[1]) : 0 };
}
