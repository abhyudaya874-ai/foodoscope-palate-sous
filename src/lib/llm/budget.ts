import { readFileSync } from "node:fs";
import path from "node:path";
import { BudgetError } from "./types";
import type { EventBus } from "../events/log";

export interface BudgetConfig {
  maxToolCallsPerRun: number;
  maxApiCalls: number;
  maxLlmTokensPerRun: number;
  perRoleTokenCaps: Record<string, number>;
  foodoscopeTokenWallet: number;
  maxSearchCalls?: number;
  maxBrowserSteps?: number;
}

export function loadBudget(): BudgetConfig {
  return JSON.parse(readFileSync(path.join(process.cwd(), "BUDGET.json"), "utf8")) as BudgetConfig;
}

export class Budget {
  apiCalls = 0;
  llmTokens = 0;
  toolCalls = 0;
  walletSpent = 0;
  roleTokens: Record<string, number> = {};
  constructor(public cfg: BudgetConfig, private bus?: EventBus) {}

  private bump(kind: "api" | "llm" | "tool" | "wallet", used: number, cap: number) {
    this.bus?.emit("budget.update", "system", { kind, used, cap });
  }
  takeApi(): void {
    if (++this.apiCalls > this.cfg.maxApiCalls) throw new BudgetError(`maxApiCalls ${this.cfg.maxApiCalls} exceeded`);
    this.bump("api", this.apiCalls, this.cfg.maxApiCalls);
  }
  takeWallet(tokens: number): void {
    this.walletSpent += tokens;
    if (this.walletSpent > this.cfg.foodoscopeTokenWallet)
      throw new BudgetError(`foodoscopeTokenWallet ${this.cfg.foodoscopeTokenWallet} exceeded`);
    this.bump("wallet", this.walletSpent, this.cfg.foodoscopeTokenWallet);
  }
  takeLlm(role: string, tokens: number): void {
    this.llmTokens += tokens;
    this.roleTokens[role] = (this.roleTokens[role] ?? 0) + tokens;
    if (this.llmTokens > this.cfg.maxLlmTokensPerRun)
      throw new BudgetError(`maxLlmTokensPerRun ${this.cfg.maxLlmTokensPerRun} exceeded`);
    const roleCap = this.cfg.perRoleTokenCaps[role];
    if (roleCap && this.roleTokens[role] > roleCap)
      throw new BudgetError(`perRoleTokenCaps.${role} ${roleCap} exceeded`);
    this.bump("llm", this.llmTokens, this.cfg.maxLlmTokensPerRun);
  }
  takeTool(): void {
    if (++this.toolCalls > this.cfg.maxToolCallsPerRun)
      throw new BudgetError(`maxToolCallsPerRun ${this.cfg.maxToolCallsPerRun} exceeded`);
    this.bump("tool", this.toolCalls, this.cfg.maxToolCallsPerRun);
  }
}
