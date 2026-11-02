import { hostAllowed, looksInjected, needsConfirm, redact } from "./guards";
import { Decision, type BrowserResult, type Driver, type Extracted, type Observation } from "./types";
import type { Emit } from "../search/types";

export interface DecideCtx {
  goal: string;
  obs: Observation;
  history: string[]; // last few step notes, short
  extracted: Record<string, Extracted>;
  stepsLeft: number;
}

export interface AgentDeps {
  driver: Driver;
  decide: (ctx: DecideCtx) => Promise<unknown>; // returns raw JSON; the loop validates it
  allowDomains: string[];
  maxSteps: number; // from BUDGET.json -> maxBrowserSteps
  emit: Emit;
  confirm: (summary: string) => Promise<boolean>; // wired to the Confirmation element
}

/**
 * The whole agent: observe -> decide -> guard -> act. Nothing else.
 * Invariants (each has a test): default-deny hosts, human confirm on sensitive actions,
 * no `done` without extracted evidence, loop/stagnation stop, injection flagged not obeyed.
 */
export async function runBrowserTask(goal: string, deps: AgentDeps): Promise<BrowserResult> {
  const extracted: Record<string, Extracted> = {};
  const history: string[] = [];
  const seen = new Map<string, number>();
  let badOutputs = 0;
  let blocks = 0;

  deps.emit("run.start", { kind: "browser", goal });
  const finish = (r: Omit<BrowserResult, "extracted">): BrowserResult => {
    deps.emit("run.end", { kind: "browser", status: r.status, steps: r.steps });
    return { ...r, extracted };
  };

  for (let step = 1; step <= deps.maxSteps; step++) {
    const obs = await deps.driver.observe();
    const flagged = looksInjected(obs.text) || obs.elements.some((e) => looksInjected(e.name));
    if (flagged) deps.emit("bug.detected", { kind: "injection", source: obs.url });

    const raw = await deps.decide({ goal, obs, history: history.slice(-6), extracted, stepsLeft: deps.maxSteps - step + 1 });
    const parsed = Decision.safeParse(raw);
    if (!parsed.success) {
      badOutputs += 1;
      history.push("invalid output: reply with JSON matching the schema");
      if (badOutputs >= 2) return finish({ status: "failed", reason: "model returned invalid decisions twice", steps: step });
      continue;
    }
    badOutputs = 0;
    const { thought, action } = parsed.data;

    if (action.type === "fail") return finish({ status: "failed", reason: action.reason, steps: step });

    if (action.type === "done") {
      const missing = action.evidenceKeys.filter((k) => !extracted[k]);
      if (missing.length) {
        history.push(`done rejected: no extracted evidence for ${missing.join(",")}. Use extract first.`);
        continue;
      }
      deps.emit("browser.step", { step, url: obs.url, action: "done", thought });
      return finish({ status: "done", result: action.result, steps: step });
    }

    if (action.type === "goto" && !hostAllowed(action.url, deps.allowDomains)) {
      blocks += 1;
      history.push(`blocked host: ${new URL(action.url).hostname} is not allowed`);
      deps.emit("browser.step", { step, url: obs.url, action: "goto", blocked: true, thought });
      if (blocks >= 3) return finish({ status: "blocked", reason: "repeated attempts to leave the allowlist", steps: step });
      continue;
    }

    const key = obs.url + JSON.stringify(action);
    seen.set(key, (seen.get(key) ?? 0) + 1);
    if ((seen.get(key) ?? 0) >= 3) return finish({ status: "failed", reason: "stuck in a loop", steps: step });

    const el = "ref" in action && action.ref ? obs.elements.find((e) => e.ref === action.ref) : undefined;
    if ("ref" in action && action.ref && !el) {
      history.push(`unknown ref ${action.ref}: use refs from the current page only`);
      continue;
    }

    if (needsConfirm(action, el)) {
      const ok = await deps.confirm(`${action.type} on "${el?.name ?? ""}" at ${obs.url}`);
      if (!ok) return finish({ status: "blocked", reason: "human denied a sensitive action", steps: step });
    }

    const res = await deps.driver.act(action);
    if (action.type === "extract" && res.extracted !== undefined) {
      extracted[action.key] = { url: obs.url, text: redact(res.extracted).slice(0, 1500), flagged: looksInjected(res.extracted) };
    }
    history.push(`${action.type}${"ref" in action && action.ref ? " " + action.ref : ""}: ${res.ok ? "ok" : "failed " + (res.note ?? "")}`.slice(0, 120));
    deps.emit("browser.step", { step, url: obs.url, action: action.type, ok: res.ok, thought });
  }
  return finish({ status: "budget", reason: "maxBrowserSteps reached", steps: deps.maxSteps });
}
