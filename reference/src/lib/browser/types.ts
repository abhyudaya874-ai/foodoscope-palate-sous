// CONTRACT FILE. Copy verbatim. Do not rename or reshape. Change only via an ADR in DECISIONS.md.
import { z } from "zod";

const Ref = z.string().regex(/^e\d{1,3}$/); // element refs come ONLY from the latest Observation

export const Action = z.discriminatedUnion("type", [
  z.object({ type: z.literal("goto"), url: z.string().url() }),
  z.object({ type: z.literal("click"), ref: Ref }),
  z.object({ type: z.literal("type"), ref: Ref, text: z.string().max(500), submit: z.boolean().default(false) }),
  z.object({ type: z.literal("select"), ref: Ref, value: z.string().max(200) }),
  z.object({ type: z.literal("scroll"), dir: z.enum(["down", "up"]) }),
  z.object({ type: z.literal("extract"), key: z.string().regex(/^[a-z0-9_]{1,40}$/), ref: Ref.optional() }),
  z.object({ type: z.literal("back") }),
  z.object({ type: z.literal("done"), result: z.string().max(2000), evidenceKeys: z.array(z.string()).min(1) }),
  z.object({ type: z.literal("fail"), reason: z.string().max(300) }),
]);
export type Action = z.infer<typeof Action>;

export const Decision = z.object({ thought: z.string().max(200), action: Action });
export type Decision = z.infer<typeof Decision>;

export interface PageElement {
  ref: string;
  role: string;
  name: string;
  type?: string; // input type, e.g. "password"
}
export interface Observation {
  url: string;
  title: string;
  elements: PageElement[];
  text: string; // visible text excerpt, UNTRUSTED
}
export interface Extracted {
  url: string;
  text: string;
  flagged: boolean;
}
export interface StepResult {
  ok: boolean;
  note?: string;
  extracted?: string;
}

/** The ONLY thing the agent loop knows about a browser. Playwright is one implementation; tests use a fake. */
export interface Driver {
  observe(): Promise<Observation>;
  act(a: Action): Promise<StepResult>;
  close(): Promise<void>;
}

export type BrowserStatus = "done" | "failed" | "budget" | "blocked";
export interface BrowserResult {
  status: BrowserStatus;
  result?: string;
  reason?: string;
  steps: number;
  extracted: Record<string, Extracted>;
}
