import { NextResponse } from "next/server";
import path from "node:path";
import { registry, replayInto } from "@/lib/workspace/runs";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { speed?: number; fixture?: string };
  const speed = typeof body.speed === "number" && body.speed > 0 && body.speed <= 20 ? body.speed : 1;
  const chan = registry.create();
  const fixture = path.join(process.cwd(), "fixtures", body.fixture ?? "demo-run.jsonl");
  void replayInto(chan, fixture, speed);
  return NextResponse.json({ runId: chan.id, replay: true });
}
