import { NextResponse } from "next/server";
import path from "node:path";
import { registry, replayInto } from "@/lib/workspace/runs";
import { config } from "@/lib/config";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { speed?: number; fixture?: string };
  const speed = typeof body.speed === "number" && body.speed > 0 && body.speed <= 20 ? body.speed : 1;
  const id = `replay-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  // Lambdas share no registry: on Vercel the stream route replays the fixture
  // statelessly for replay-* ids. Locally we keep the live in-memory channel.
  if (!config.onVercel()) {
    const chan = registry.create(id);
    const fixture = path.join(process.cwd(), "fixtures", body.fixture ?? "demo-run.jsonl");
    void replayInto(chan, fixture, speed);
  }
  return NextResponse.json({ runId: id, replay: true });
}
