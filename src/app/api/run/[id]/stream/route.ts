import { registry, loadReplay } from "@/lib/workspace/runs";
import path from "node:path";

export const runtime = "nodejs";
export const maxDuration = 60; // serverless: the paced replay must fit the function window

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const chan = registry.get(id);
  const url = new URL(req.url);
  const from = Number(url.searchParams.get("from") ?? req.headers.get("last-event-id") ?? 0);

  // Stateless fallback (serverless): the POST that created the run ran on a different lambda,
  // so replay the fixture directly here instead of 404-ing.
  const stateless = !chan && id.startsWith("replay-");
  if (!chan && !stateless) return new Response("run not found", { status: 404 });

  const fixtureName = (url.searchParams.get("fixture") ?? "demo-run.jsonl").replace(/[/\\]/g, "");
  const speed = Math.min(20, Math.max(0.5, Number(url.searchParams.get("speed") ?? 1) || 1));

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (m: { seq: number; type: string; data: unknown; ts: string }) => {
        controller.enqueue(enc.encode(`id: ${m.seq}\nevent: ${m.type}\ndata: ${JSON.stringify(m)}\n\n`));
      };
      if (chan) {
        for (const m of chan.messages) if (m.seq > from) send(m); // resume
        const unsub = chan.subscribe(send);
        const hb = setInterval(() => controller.enqueue(enc.encode(": hb\n\n")), 15000);
        req.signal.addEventListener("abort", () => { unsub(); clearInterval(hb); controller.close(); });
        return;
      }
      // stateless paced replay; `from` skips already-seen seqs on resume
      const hb = setInterval(() => controller.enqueue(enc.encode(": hb\n\n")), 15000);
      req.signal.addEventListener("abort", () => { clearInterval(hb); controller.close(); });
      try {
        const msgs = loadReplay(path.join(process.cwd(), "fixtures", fixtureName));
        for (const m of msgs) {
          if (req.signal.aborted) return;
          if (m.seq <= from) continue;
          send(m);
          await new Promise((r) => setTimeout(r, 400 / speed)); // compact pacing to fit the window
        }
        send({ seq: 999999, type: "done", data: { replay: true }, ts: new Date().toISOString() });
      } catch {
        send({ seq: 999998, type: "tool.error", data: { kind: "contract", message: `fixture ${fixtureName} unavailable` }, ts: new Date().toISOString() });
      } finally {
        clearInterval(hb);
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}
