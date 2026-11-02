import { SearchError } from "./types";

/** POST JSON with timeout + retry on transient errors only. Never puts headers/keys in error text. */
export async function postJson<T>(
  url: string,
  headers: Record<string, string>,
  body: unknown,
  opts: { timeoutMs?: number; retries?: number } = {},
): Promise<T> {
  const { timeoutMs = 20_000, retries = 2 } = opts;
  const host = new URL(url).host;
  let attempt = 0;
  for (;;) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      if (res.ok) return (await res.json()) as T;
      const kind =
        res.status === 401 || res.status === 403 ? "auth" : res.status === 429 || res.status >= 500 ? "transient" : "contract";
      if (kind !== "transient" || attempt >= retries) throw new SearchError(`HTTP ${res.status} from ${host}`, kind, res.status);
    } catch (e) {
      if (e instanceof SearchError) throw e;
      if (attempt >= retries) throw new SearchError(`network error calling ${host}`, "transient");
    } finally {
      clearTimeout(timer);
    }
    attempt += 1;
    await new Promise((r) => setTimeout(r, 400 * 2 ** attempt));
  }
}
