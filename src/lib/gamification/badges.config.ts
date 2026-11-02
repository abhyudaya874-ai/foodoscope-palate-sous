export interface BadgeRule {
  id: string;
  name: string;
  description: string;
}

export const BADGES: BadgeRule[] = [
  { id: "first-blood", name: "First Blood", description: "first confirmed bug with a saved repro" },
  { id: "green-run", name: "Green Run", description: "a verify run with 0 regressions" },
  { id: "crosswalker", name: "Crosswalker", description: "crosswalk matched_after improves on baseline" },
];
