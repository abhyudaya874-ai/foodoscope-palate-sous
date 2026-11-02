import type { ChatMessage, Usage } from "./types";

export class ProviderHttpError extends Error {
  constructor(public status: number, body: string, public provider: string) {
    super(`${provider} HTTP ${status}: ${body.slice(0, 300)}`);
    this.name = "ProviderHttpError";
  }
}

interface CompletionResult {
  text: string;
  usage: Usage;
  model: string;
}

export type FetchImpl = typeof fetch;

const TIMEOUT_MS = 30_000;

export async function chatCompletion(opts: {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  provider: string;
  fetchImpl?: FetchImpl;
}): Promise<CompletionResult> {
  const f = opts.fetchImpl ?? fetch;
  const res = await f(`${opts.baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${opts.apiKey}` },
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.1,
      ...(opts.maxTokens ? { max_tokens: opts.maxTokens } : {}),
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const body = await res.text();
  if (!res.ok) throw new ProviderHttpError(res.status, body, opts.provider);
  const j = JSON.parse(body) as {
    choices?: { message?: { content?: string } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
    model?: string;
  };
  return {
    text: j.choices?.[0]?.message?.content ?? "",
    usage: { tokensIn: j.usage?.prompt_tokens ?? 0, tokensOut: j.usage?.completion_tokens ?? 0 },
    model: j.model ?? opts.model,
  };
}

export async function listModels(opts: {
  baseUrl: string;
  apiKey: string;
  provider: string;
  fetchImpl?: FetchImpl;
}): Promise<string[]> {
  const f = opts.fetchImpl ?? fetch;
  const res = await f(`${opts.baseUrl}/models`, {
    headers: { authorization: `Bearer ${opts.apiKey}` },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const body = await res.text();
  if (!res.ok) throw new ProviderHttpError(res.status, body, opts.provider);
  const j = JSON.parse(body) as { data?: { id: string }[] };
  return (j.data ?? []).map((m) => m.id).sort();
}
