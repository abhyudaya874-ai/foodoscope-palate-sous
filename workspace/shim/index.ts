// Sous client shim — fixes ONLY confirmed contract issues.
// Fixes: H2 param rename (naturalSource -> natural_source_name),
//        B2 numeric-string coercion on recipe fields,
//        error-envelope normalization ({error} | {statusCode,message} -> uniform).
export interface ShimResult<T> {
  params: T;
  applied: string[];
}

const PARAM_RENAMES: Record<string, string> = {
  naturalSource: "natural_source_name", // confirmed H2 repro: fixtures/api/flavordb.entities.by.natural.source.923b967f.json
};

const NUMERIC_FIELDS = ["Calories", "cook_time", "prep_time", "servings", "total_time"];

export function createFoodoscopeShim() {
  return {
    /** Apply confirmed param renames to a request's query params. */
    rewriteParams<T extends Record<string, string>>(params: T): ShimResult<Record<string, string>> {
      const out: Record<string, string> = {};
      const applied: string[] = [];
      for (const [k, v] of Object.entries(params)) {
        const nk = PARAM_RENAMES[k];
        if (nk) { out[nk] = v; applied.push(`${k}->${nk}`); }
        else out[k] = v;
      }
      return { params: out, applied };
    },

    /** Coerce string-encoded numerics on a recipe object (confirmed B2). */
    normalizeRecipe<T extends Record<string, unknown>>(r: T): T {
      const out = { ...r } as Record<string, unknown>;
      for (const f of NUMERIC_FIELDS) {
        const v = out[f];
        if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) out[f] = Number(v);
      }
      return out as T;
    },

    /** Normalize either observed error envelope into one shape. */
    normalizeError(body: unknown): { ok: false; status?: number; message: string } {
      const b = body as { error?: string; statusCode?: number; message?: string };
      return { ok: false, status: b?.statusCode, message: b?.error ?? b?.message ?? "unknown error" };
    },
  };
}
