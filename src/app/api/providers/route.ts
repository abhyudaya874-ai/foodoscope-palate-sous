// GET /api/providers — which LLM providers have keys configured (booleans only; never returns secrets).
import { config } from "@/lib/config";

export const runtime = "nodejs";

export async function GET() {
  const k = config.keys;
  const providers = { groq: !!k.groq, nvidia: !!k.nvidia, openrouter: !!k.openrouter };
  const first = Object.entries(providers).find(([, v]) => v)?.[0];
  return Response.json({ providers, available: first ?? null });
}
