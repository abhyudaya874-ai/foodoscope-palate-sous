import { NextResponse } from "next/server";
import { z } from "zod";
import { complete } from "@/lib/llm/gateway";
import { Budget, loadBudget } from "@/lib/llm/budget";
import { JsonlEventBus } from "@/lib/events/log";

export const runtime = "nodejs";

const bodySchema = z.object({
  role: z.enum(["router", "planner", "coder", "matcher", "writer"]),
  messages: z.array(z.object({ role: z.enum(["system", "user", "assistant"]), content: z.string() })).max(20),
  maxTokens: z.number().int().positive().max(4000).optional(),
});

export async function POST(req: Request) {
  const body = bodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "invalid body" }, { status: 400 });
  try {
    const bus = new JsonlEventBus();
    const out = await complete(
      { role: body.data.role, messages: body.data.messages, maxTokens: body.data.maxTokens },
      { bus, budget: new Budget(loadBudget(), bus) },
    );
    return NextResponse.json({ text: out.text, provider: out.provider, model: out.model, usage: out.usage, cache: out.cache });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
