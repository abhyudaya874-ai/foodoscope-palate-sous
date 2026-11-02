// POST /api/think {goal} — streams the model's REAL thinking + plan text (SSE) from a free-tier provider.
// Events: meta {provider, model} · reasoning {text} · text {text} · done · error {message}. Keys stay server-side.
import "@/lib/config";
import { candidatesForRole } from "@/lib/llm/models.config";
import { PROVIDERS, providerKey } from "@/lib/llm/providers";

export const runtime = "nodejs";

const SYSTEM = `You are Sous, an autonomous agent that audits the Foodoscope food-data APIs (RecipeDB2, FlavorDB) for contract drift.
Given a goal, think briefly about HOW you would approach it: which endpoints you would probe, which contract problems you would test for, and what evidence would prove or disprove each. You have NOT run anything yet: never state results, counts or findings as facts. Answer in at most 90 words.`;

export async function POST(req: Request) {
  const { goal } = (await req.json().catch(() => ({}))) as { goal?: string };
  const rank = { groq: 0, openrouter: 1, nvidia: 2 } as const;
  const cands = candidatesForRole("planner").sort((a, b) => rank[a.provider] - rank[b.provider]);
  const enc = new TextEncoder();

  const stream = new ReadableStream({
    async start(c) {
      const send = (event: string, data: unknown) => c.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      for (const cand of cands) {
        const key = providerKey(cand.provider);
        if (!key) continue;
        try {
          const res = await fetch(`${PROVIDERS[cand.provider].baseUrl}/chat/completions`, {
            method: "POST",
            headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
            body: JSON.stringify({
              model: cand.model, stream: true, max_tokens: 1200, temperature: 0.3,
              messages: [{ role: "system", content: SYSTEM }, { role: "user", content: String(goal ?? "").slice(0, 400) }],
            }),
            signal: AbortSignal.timeout(40000),
          });
          if (!res.ok || !res.body) continue;
          send("meta", { provider: cand.provider, model: cand.model });
          const reader = res.body.getReader();
          const dec = new TextDecoder();
          let buf = "";
          for (;;) {
            const { value, done } = await reader.read();
            if (done) break;
            buf += dec.decode(value, { stream: true });
            const lines = buf.split("\n");
            buf = lines.pop() ?? "";
            for (const line of lines) {
              if (!line.startsWith("data:")) continue;
              const payload = line.slice(5).trim();
              if (payload === "[DONE]") continue;
              try {
                const delta = (JSON.parse(payload) as { choices?: { delta?: { content?: string; reasoning?: string; reasoning_content?: string } }[] }).choices?.[0]?.delta;
                const r = delta?.reasoning ?? delta?.reasoning_content;
                if (r) send("reasoning", { text: r });
                if (delta?.content) send("text", { text: delta.content });
              } catch { /* ignore keep-alive / partial frames */ }
            }
          }
          send("done", {});
          c.close();
          return;
        } catch { continue; }
      }
      send("error", { message: "No free provider responded. Replay still works offline." });
      c.close();
    },
  });
  return new Response(stream, { headers: { "content-type": "text/event-stream", "cache-control": "no-cache, no-transform" } });
}
