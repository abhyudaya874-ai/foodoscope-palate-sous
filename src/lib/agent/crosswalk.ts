import { distance } from "fastest-levenshtein";
import { parseCsv } from "../workspace/csv";

export interface CrosswalkConfig {
  fuzzyThreshold: number; // 0..1 similarity (1 - dist/maxLen)
  aliasTable: Record<string, string>;
}

export const DEFAULT_XWALK_CFG: CrosswalkConfig = {
  fuzzyThreshold: 0.8,
  aliasTable: {
    jeera: "cumin", haldi: "turmeric", dhania: "coriander", methi: "fenugreek",
    elaichi: "cardamom", kali_mirch: "black pepper", adrak: "ginger", hing: "asafoetida",
    sarson: "mustard", imli: "tamarind", gud: "jaggery", doodh: "milk", dahi: "yogurt",
    aloo: "potato", pyaaz: "onion", tamatar: "tomato", palak: "spinach",
    chawal: "rice", besan: "chickpea flour", nariyal: "coconut", kesar: "saffron",
    kaju: "cashew", kishmish: "raisin", tej_patta: "bay leaf", curry_patta: "curry leaf",
    moong: "mung bean", chana: "chickpea", mirch: "chilli",
  },
};

export function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/\(.*?\)/g, "").replace(/[^a-z\s_]/g, "").replace(/\s+/g, "_").replace(/^_+|_+$/g, "");
}

export function similarity(a: string, b: string): number {
  const max = Math.max(a.length, b.length);
  return max === 0 ? 1 : 1 - distance(a, b) / max;
}

export interface MatchRow {
  source: string;
  normalized: string;
  target: string;
  method: "exact" | "alias" | "fuzzy" | "unmatched";
  similarity: number;
  confidence: "H" | "M" | "L";
}

export function runCrosswalk(sampleRows: string[][], candidates: string[], cfg = DEFAULT_XWALK_CFG) {
  const normCandidates = new Map(candidates.map((c) => [normalize(c), c]));
  const rows: MatchRow[] = [];
  let matchedBefore = 0;

  for (const [raw] of sampleRows) {
    const n = normalize(raw);
    if (candidates.includes(raw)) matchedBefore++; // raw equality = "before" baseline
    if (normCandidates.has(n)) {
      rows.push({ source: raw, normalized: n, target: normCandidates.get(n)!, method: "exact", similarity: 1, confidence: "H" });
      continue;
    }
    const alias = cfg.aliasTable[n];
    if (alias && normCandidates.has(normalize(alias))) {
      rows.push({ source: raw, normalized: n, target: normCandidates.get(normalize(alias))!, method: "alias", similarity: 1, confidence: "H" });
      continue;
    }
    let best = { c: "", sim: 0 };
    for (const [nc, orig] of normCandidates) {
      const sim = similarity(n, nc);
      if (sim > best.sim) best = { c: orig, sim };
    }
    if (best.sim >= cfg.fuzzyThreshold) {
      rows.push({ source: raw, normalized: n, target: best.c, method: "fuzzy", similarity: Number(best.sim.toFixed(3)), confidence: best.sim >= 0.9 ? "M" : "L" });
    } else {
      rows.push({ source: raw, normalized: n, target: "NA", method: "unmatched", similarity: Number(best.sim.toFixed(3)), confidence: "H" });
    }
  }
  const matchedAfter = rows.filter((r) => r.target !== "NA").length;
  return { rows, matchedBefore, matchedAfter, n: rows.length };
}

export function loadSampleCsv(text: string): string[][] {
  return parseCsv(text).filter((r) => r[0] && r[0] !== "ingredient_name");
}
