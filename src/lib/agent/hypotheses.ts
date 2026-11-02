import type { ProbeResult } from "../foodoscope/client";

export type HStatus = "CONFIRMED" | "NOT_REPRODUCED" | "INCONCLUSIVE";
export interface Finding {
  id: string;
  title: string;
  status: HStatus;
  evidence: string[];
  note: string;
  reproPath?: string;
}

const has = (o: unknown, k: string) => typeof o === "object" && o !== null && k in o;

function entityFixture(res: ProbeResult | undefined): { fields: string[]; n: number } {
  const b = res?.body as { content?: Record<string, unknown>[] };
  const first = b?.content?.[0];
  return { fields: first ? Object.keys(first) : [], n: b?.content?.length ?? 0 };
}

export function checkH1(ent: ProbeResult | undefined): Finding {
  const { fields, n } = entityFixture(ent);
  if (n === 0) return { id: "H1", title: "Entity response lacks molecule array", status: "INCONCLUSIVE", evidence: [], note: "no entity fixture" };
  const lacks = !fields.some((f) => /molecule|compound/i.test(f));
  return {
    id: "H1",
    title: "Entity response lacks molecule array — no direct entity→molecule join",
    status: lacks ? "CONFIRMED" : "NOT_REPRODUCED",
    evidence: ent?.fixture ? [ent.fixture] : [],
    note: lacks ? `${n} sampled entities expose no molecule/compound field; join needs a molecules endpoint or alias lookup` : `entity exposes molecule-related field`,
    reproPath: ent?.fixture,
  };
}

export function checkH2(bad: ProbeResult | undefined, good: ProbeResult | undefined): Finding {
  const badErr = (bad?.body as { message?: string })?.message ?? "";
  if (!bad || !good) return { id: "H2", title: "Documented param name rejected", status: "INCONCLUSIVE", evidence: [], note: "missing one of paired probes" };
  const confirmed = bad.status === 400 && good.status === 200;
  return {
    id: "H2",
    title: "by-natural-source rejects documented param 'naturalSource'; actual param is 'natural_source_name'",
    status: confirmed ? "CONFIRMED" : "NOT_REPRODUCED",
    evidence: [bad.fixture, good.fixture].filter(Boolean) as string[],
    note: `documented param -> ${bad.status} ("${badErr}"); corrected param -> ${good.status}`,
    reproPath: bad.fixture,
  };
}

export function checkH3(ent: ProbeResult | undefined): Finding {
  const { fields, n } = entityFixture(ent);
  if (n === 0) return { id: "H3", title: "Taste vs aroma descriptors mixed", status: "INCONCLUSIVE", evidence: [], note: "no entity fixture" };
  const hasDescriptors = fields.some((f) => /taste|aroma|flavor_profile|descriptor/i.test(f));
  return {
    id: "H3",
    title: "Taste vs aroma descriptors mixed in one field",
    status: "INCONCLUSIVE",
    evidence: ent?.fixture ? [ent.fixture] : [],
    note: hasDescriptors ? "descriptor field present; needs N-row sampling + hand-check (not run within budget)" : "no descriptor field on sampled entities; needs molecules endpoint",
    reproPath: ent?.fixture,
  };
}

export function checkH4(ent: ProbeResult | undefined): Finding {
  const b = ent?.body as { totalElements?: number; totalPages?: number };
  return {
    id: "H4",
    title: "Ingredient counts differ between docs, UI and API",
    status: "INCONCLUSIVE",
    evidence: ent?.fixture ? [ent.fixture] : [],
    note: `website states "1,000+ natural ingredients" (foodoscope.com); measured natural_source_name=apple -> totalElements=${b?.totalElements ?? "NA"}; global API count not measured within budget`,
    reproPath: ent?.fixture,
  };
}

export function checkB2NumericStrings(recipe: ProbeResult | undefined): Finding {
  const d = (recipe?.body as { data?: Record<string, unknown>[] })?.data?.[0];
  if (!d) return { id: "B2", title: "Numeric fields string-encoded", status: "INCONCLUSIVE", evidence: [], note: "no recipe fixture" };
  const strNums = ["Calories", "cook_time", "prep_time", "servings", "total_time"].filter((k) => has(d, k) && typeof d[k] === "string");
  return {
    id: "B2",
    title: "Recipe numeric fields (Calories, times, servings) are string-encoded",
    status: strNums.length >= 3 ? "CONFIRMED" : "NOT_REPRODUCED",
    evidence: recipe?.fixture ? [recipe.fixture] : [],
    note: `${strNums.length} numeric fields arrive as strings, e.g. Calories="${d.Calories}"`,
    reproPath: recipe?.fixture,
  };
}
