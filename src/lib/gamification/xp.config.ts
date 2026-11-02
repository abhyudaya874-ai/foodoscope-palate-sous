export const XP_TABLE = {
  "probe.call": 2,            // with evidence
  "bug.detected": 25,         // CONFIRMED with saved repro
  "fix.verified": 40,         // failing->passing proof
  "report.drafted": 15,       // approved by human
  "patch.applied.tokensaved": 10,
} as const;

export const RANKS = [
  { name: "Prep Cook", at: 0 },
  { name: "Line Cook", at: 50 },
  { name: "Sous Chef", at: 120 },
  { name: "Chef de Partie", at: 250 },
  { name: "Head Chef", at: 500 },
  { name: "Executive Chef", at: 1000 },
] as const;
