// proof:check — every metric line in PROOF.md must carry a (source: ...) tag.
import { readFileSync } from "node:fs";

const lines = readFileSync("PROOF.md", "utf8").split("\n");
let fail = 0;
for (const [i, l] of lines.entries()) {
  const isMetric = /^- .+\d/.test(l) || /^- .*: .+/.test(l);
  if (isMetric && !l.includes("(source:") && !l.includes("[measure]") && !/^- (none|no )/.test(l)) {
    console.log(`PROOF.md:${i + 1} unsourced number: ${l}`);
    fail++;
  }
}
console.log(fail ? `proof-check: ${fail} unsourced claims` : "proof-check: clean");
process.exit(fail ? 1 : 0);
