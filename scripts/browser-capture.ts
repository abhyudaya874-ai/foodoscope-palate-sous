// browser-capture — re-drives the RECORDED browser-agent decisions (fixtures/browser/<task>.jsonl) in real Playwright,
// saving one screenshot + real cursor target (element bounding box) per step -> public/browser/<task>/ + frames.json.
// No LLM calls. Public sites only. Output powers the Comet-style Browser pane (labelled REPLAY).
import { chromium } from "playwright";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createPlaywrightDriver, type PageLike } from "../src/lib/browser/pw-driver";

const START: Record<string, string> = { docs: "https://www.foodoscope.com/", rival: "https://spoonacular.com/food-api" };
const W = 1280, H = 800;

interface Rec { obs: { elements: { ref: string; name: string }[] }; raw: { thought?: string; action?: { type: string; ref?: string; key?: string; result?: string } } | null }

const b = await chromium.launch({ headless: true });
for (const task of Object.keys(START)) {
  const lines = readFileSync(`fixtures/browser/${task}.jsonl`, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as Rec);
  const dir = `public/browser/${task}`;
  mkdirSync(dir, { recursive: true });
  const page = await b.newPage({ viewport: { width: W, height: H } });
  await page.goto(START[task], { waitUntil: "domcontentloaded", timeout: 25000 });
  await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => undefined);
  const driver = createPlaywrightDriver(page as unknown as PageLike, async () => undefined);
  const frames: Record<string, unknown>[] = [];
  let prev = { x: 0.1, y: 0.1 };
  for (let i = 0; i < lines.length; i++) {
    const rec = lines[i];
    const a = rec.raw?.action;
    if (!a) continue;
    const live = await driver.observe();
    let target = { x: 0.5, y: 0.45 };
    let sel: string | undefined;
    if (a.ref) {
      const name = rec.obs.elements.find((e) => e.ref === a.ref)?.name;
      const el = live.elements.find((e) => e.name === name) ?? live.elements.find((e) => e.ref === a.ref);
      if (el) {
        sel = `[data-sref="${el.ref}"]`;
        const bb = await page.locator(sel).first().boundingBox().catch(() => null);
        if (bb) target = { x: (bb.x + bb.width / 2) / W, y: (bb.y + bb.height / 2) / H };
      }
    }
    await page.screenshot({ type: "jpeg", quality: 55 }).then((buf) => writeFileSync(`${dir}/${frames.length}.jpg`, buf));
    frames.push({ n: frames.length, url: page.url(), title: await page.title(), from: prev, cursor: target, action: a.type, thought: rec.raw?.thought ?? "", key: a.key, result: a.result });
    prev = target;
    if (a.type === "click" && sel) {
      await page.click(sel, { timeout: 5000 }).catch(() => undefined);
      await page.waitForLoadState("domcontentloaded", { timeout: 8000 }).catch(() => undefined);
      await page.waitForLoadState("networkidle", { timeout: 6000 }).catch(() => undefined);
    }
  }
  // final settled frame
  await page.screenshot({ type: "jpeg", quality: 55 }).then((buf) => writeFileSync(`${dir}/${frames.length}.jpg`, buf));
  frames.push({ n: frames.length, url: page.url(), title: await page.title(), from: prev, cursor: prev, action: "settled", thought: "", });
  writeFileSync(`${dir}/frames.json`, JSON.stringify({ task, startedAt: new Date().toISOString(), viewport: { w: W, h: H }, frames }, null, 1));
  console.log(task, frames.length, "frames ->", dir);
  await page.close();
}
await b.close();
