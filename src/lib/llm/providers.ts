import type { ProviderId } from "./types";

export const PROVIDERS: Record<ProviderId, { baseUrl: string; apiKeyEnv: string }> = {
  groq: { baseUrl: "https://api.groq.com/openai/v1", apiKeyEnv: "GROQ_API_KEY" },
  nvidia: { baseUrl: "https://integrate.api.nvidia.com/v1", apiKeyEnv: "NVIDIA_API_KEY" },
  openrouter: { baseUrl: "https://openrouter.ai/api/v1", apiKeyEnv: "OPENROUTER_API_KEY" },
};

export function providerKey(id: ProviderId): string | undefined {
  const v = process.env[PROVIDERS[id].apiKeyEnv];
  return v && v.length > 0 ? v : undefined;
}
