// UI screenshot capture: node scripts/ui-shots.ts <outDir> [url]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const out = process.argv[2] ?? "docs/ui/before";
const url = process.argv[3] ?? "http://localhost:3001/";
mkdirSync(out, { recursive: true });

const b = await chromium.launch({ headless: true });
const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: "networkidle", timeout: 20000 }).catch(() => {});
await page.waitForTimeout(1200);
await page.screenshot({ path: `${out}/01-idle.png` });

// start replay, capture streaming mid-run
const runBtn = page.getByRole("button", { name: /watch a replay|run replay/i }).first();
if (await runBtn.count()) {
  await runBtn.click();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${out}/02-streaming.png` });
  await page.waitForTimeout(9000);
  await page.screenshot({ path: `${out}/03-finished.png` });
  for (const tab of ["Plan", "Files", "Diff", "CSV", "Terminal", "Tests", "Profile"]) {
    const t = page.getByRole("button", { name: tab, exact: true }).first();
    if (await t.count()) { await t.click(); await page.waitForTimeout(350); await page.screenshot({ path: `${out}/04-tab-${tab.toLowerCase()}.png` }); }
  }
}
// mobile
const m = await b.newPage({ viewport: { width: 390, height: 844 } });
await m.goto(url, { waitUntil: "networkidle", timeout: 20000 }).catch(() => {});
await m.waitForTimeout(1000);
await m.screenshot({ path: `${out}/05-mobile-idle.png` });
await b.close();
console.log("shots saved to", out);
