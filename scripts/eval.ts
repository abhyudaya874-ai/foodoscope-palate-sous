// Prompt eval (offline): every prompt file has the 8 required sections and the
// schema allows an abstention (NA / NOT_REPRODUCED / INCONCLUSIVE / supported:false).
import { readFileSync } from "node:fs";
import { listPrompts, loadPrompt } from "../src/lib/prompts/load";

const SECTIONS = ["<role>", "<goal>", "<context>", "<constraints>", "<procedure>", "<output_schema>", "<examples>", "<untrusted_data>"];
let fail = 0;
const prompts = listPrompts();
for (const name of prompts) {
  const p = loadPrompt(name);
  const missing = SECTIONS.filter((s) => !p.text.includes(s));
  const hasAbstain = /NA|NOT_REPRODUCED|INCONCLUSIVE|supported.*false/i.test(p.text);
  if (missing.length || !hasAbstain) {
    fail++;
    console.log(`FAIL ${name}: missing=${missing.join(",") || "-"} abstention=${hasAbstain}`);
  } else {
    console.log(`ok   ${name} (hash ${p.hash})`);
  }
}
console.log(`${prompts.length} prompts evaluated, ${fail} failing`);
process.exit(fail ? 1 : 0);
