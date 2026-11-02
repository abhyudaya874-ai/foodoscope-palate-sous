import type { z } from "zod";

export type Role = "router" | "planner" | "coder" | "matcher" | "writer" | "browser";
export type ProviderId = "groq" | "nvidia" | "openrouter";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface Usage {
  tokensIn: number;
  tokensOut: number;
}

export interface CompleteInput {
  role: Role;
  messages: ChatMessage[];
  schema?: z.ZodType<unknown>;
  schemaName?: string;
  stream?: boolean;
  onDelta?: (d: { reasoning?: string; text?: string }) => void;
  temperature?: number;
  maxTokens?: number;
}

export interface CompleteOutput {
  text: string;
  json?: unknown;
  usage: Usage;
  provider: ProviderId;
  model: string;
  latencyMs: number;
  cache: boolean;
  fallback: boolean;
}

export class BudgetError extends Error {
  readonly kind = "budget" as const;
  constructor(msg: string) {
    super(msg);
    this.name = "BudgetError";
  }
}

export type ErrorKind = "transient" | "contract" | "auth" | "budget";
