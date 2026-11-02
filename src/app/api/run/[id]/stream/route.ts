import { registry } from "@/lib/workspace/runs";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const chan = registry.get(id);
  const url = new URL(req.url);
  const from = Number(url.searchParams.get("from") ?? req.headers.get("last-event-id") ?? 0);

  if (!chan) return new Response("run not found", { status: 404 });

  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      const send = (m: { seq: number; type: string; data: unknown; ts: string }) => {
        controller.enqueue(enc.encode(`id: ${m.seq}\nevent: ${m.type}\ndata: ${JSON.stringify(m)}\n\n`));
      };
      for (const m of chan.messages) if (m.seq > from) send(m); // resume
      const unsub = chan.subscribe(send);
      const hb = setInterval(() => controller.enqueue(enc.encode(": hb\n\n")), 15000);
      req.signal.addEventListener("abort", () => { unsub(); clearInterval(hb); controller.close(); });
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
