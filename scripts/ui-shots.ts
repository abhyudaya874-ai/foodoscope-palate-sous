// UI screenshot capture: pnpm tsx scripts/ui-shots.ts <outDir> [url]
// Captures idle, then a timed flow: real thinking stream -> paced tool run -> browser agent -> finished + sources popover.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const out = process.argv[2] ?? "docs/ui/before";
const url = process.argv[3] ?? "http://localhost:3001/";
mkdirSync(out, { recursive: true });

const b = await chromium.launch({ headless: true });
const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs: string[] = [];
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 160)); });
await page.goto(url, { waitUntil: "networkidle", timeout: 20000 }).catch(() => {});
await page.waitForTimeout(1200);
await page.screenshot({ path: `${out}/01-idle.png` });

const btn = page.getByRole("button", { name: /watch a replay|run replay|replay demo/i }).first();
if (await btn.count()) {
  await btn.click();
  const marks: [string, number][] = [["02-thinking", 3500], ["03-tools", 9000], ["04-tests", 12000], ["05-browser", 14000], ["06-browser-click", 5000], ["07-finished", 9000]];
  for (const [name, wait] of marks) { await page.waitForTimeout(wait); await page.getByRole("button", { name: "Approve", exact: true }).click({ timeout: 1500 }).catch(() => {}); await page.screenshot({ path: `${out}/${name}.png` }); }
  const src = page.getByText(/\d+ sources/).first();
  if (await src.count()) { await src.click(); await page.waitForTimeout(600); await page.screenshot({ path: `${out}/08-sources.png` }); }
}
const m = await b.newPage({ viewport: { width: 390, height: 844 } });
await m.goto(url, { waitUntil: "networkidle", timeout: 20000 }).catch(() => {});
await m.waitForTimeout(1000);
await m.screenshot({ path: `${out}/09-mobile-idle.png` });
console.log("console errors:", errs.length ? errs.join(" | ") : "none");
await b.close();
console.log("shots saved to", out);
