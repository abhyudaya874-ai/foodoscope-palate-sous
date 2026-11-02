// Playwright implementation of Driver. Structural PageLike type keeps `playwright` out of typecheck/tests.
// Usage: const { chromium } = await import("playwright"); const b = await chromium.launch({ headless: true });
//        const driver = createPlaywrightDriver(await b.newPage(), () => b.close());
import type { Action, Driver, Observation, StepResult } from "./types";

export interface PageLike {
  goto(url: string, o?: object): Promise<unknown>;
  url(): string;
  title(): Promise<string>;
  evaluate<T>(fn: () => T): Promise<T>;
  click(sel: string, o?: object): Promise<void>;
  fill(sel: string, text: string, o?: object): Promise<void>;
  press(sel: string, key: string, o?: object): Promise<void>;
  selectOption(sel: string, value: string, o?: object): Promise<unknown>;
  innerText(sel: string, o?: object): Promise<string>;
  goBack(o?: object): Promise<unknown>;
  waitForLoadState(state: string, o?: object): Promise<void>;
  mouse: { wheel(dx: number, dy: number): Promise<void> };
}

const sel = (ref: string) => `[data-sref="${ref}"]`; // ref is regex-validated by the Action schema

function snapshotInPage() {
  const q = 'a[href],button,input,select,textarea,[role=button],[role=link],[role=tab],[role=menuitem]';
  const elements: Array<{ ref: string; role: string; name: string; type?: string }> = [];
  let i = 0;
  document.querySelectorAll(q).forEach((node) => {
    if (i >= 60) return;
    const el = node as HTMLInputElement;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    const name = (el.getAttribute("aria-label") || el.innerText || el.getAttribute("placeholder") || el.value || el.getAttribute("title") || "")
      .replace(/\s+/g, " ").trim().slice(0, 80);
    const ref = "e" + ++i;
    el.setAttribute("data-sref", ref);
    elements.push({ ref, role: el.getAttribute("role") || el.tagName.toLowerCase(), name, type: el.type || undefined });
  });
  return { elements, text: document.body.innerText.replace(/\s+/g, " ").slice(0, 1500) };
}

export function createPlaywrightDriver(page: PageLike, onClose: () => Promise<void>): Driver {
  return {
    async observe(): Promise<Observation> {
      const snap = await page.evaluate(snapshotInPage);
      return { url: page.url(), title: await page.title(), ...snap };
    },
    async act(a: Action): Promise<StepResult> {
      try {
        switch (a.type) {
          case "goto": await page.goto(a.url, { timeout: 20_000, waitUntil: "domcontentloaded" }); break;
          case "click": await page.click(sel(a.ref), { timeout: 5_000 }); break;
          case "type":
            await page.fill(sel(a.ref), a.text, { timeout: 5_000 });
            if (a.submit) await page.press(sel(a.ref), "Enter");
            break;
          case "select": await page.selectOption(sel(a.ref), a.value, { timeout: 5_000 }); break;
          case "scroll": await page.mouse.wheel(0, a.dir === "down" ? 700 : -700); break;
          case "back": await page.goBack({ timeout: 10_000 }); break;
          case "extract": {
            const text = a.ref ? await page.innerText(sel(a.ref), { timeout: 5_000 }) : (await page.evaluate(snapshotInPage)).text;
            return { ok: true, extracted: text };
          }
          default: return { ok: false, note: "not a browser action" };
        }
        await page.waitForLoadState("domcontentloaded", { timeout: 5_000 }).catch(() => undefined);
        return { ok: true };
      } catch (e) {
        return { ok: false, note: e instanceof Error ? e.message.slice(0, 80) : "error" };
      }
    },
    close: onClose,
  };
}
