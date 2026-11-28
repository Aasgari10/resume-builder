// Takes a picture of every site template, desktop and phone, for the frames on the templates page
// (src/site4site/snaps/<id>.desk.jpg and <id>.phone.jpg). Pictures keep that page light; a template
// without pictures is still shown, drawn live.
//
// Needs both dev servers running (npm run dev:api, npm run dev:web) and Playwright with Chromium.
// Run from apps/web:   npm run snap               (every template)
//                      npm run snap -- kafe barg  (only these)

import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  // a global install (NODE_PATH) is only found through require
  try {
    ({ chromium } = createRequire(import.meta.url)("playwright"));
  } catch {
    console.error("Playwright is needed: npm i -D playwright && npx playwright install chromium");
    process.exit(1);
  }
}

const BASE = process.env.SNAP_URL ?? "http://localhost:5173";
const OUT = fileURLToPath(new URL("../src/site4site/snaps/", import.meta.url));
/** Desktop pictures are taken at 1280 and saved 768 wide; phones at 390 and saved 331 wide (sharp on 2x screens). */
const SHOTS = [
  { kind: "desk", width: 1280, height: 800, scale: 0.6 },
  { kind: "phone", width: 390, height: 844, scale: 0.85 },
];
/** Very long pages are cut here (CSS pixels): the frames only ever scroll so far. */
const MAX_HEIGHT = 7000;

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();

const list = await browser.newPage();
await list.goto(`${BASE}/__snap`, { waitUntil: "networkidle" });
const all = JSON.parse(await list.textContent("#snap-ids"));
await list.close();
const wanted = process.argv.slice(2);
const ids = wanted.length ? all.filter((id) => wanted.includes(id)) : all;

for (const id of ids) {
  for (const s of SHOTS) {
    const ctx = await browser.newContext({ viewport: { width: s.width, height: s.height }, deviceScaleFactor: s.scale, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/__snap?id=${id}&w=${s.width}`, { waitUntil: "load" });
    await page.waitForSelector("#snap");
    // every picture loads now, not only when scrolled to
    await page.evaluate(() => document.querySelectorAll("img").forEach((i) => (i.loading = "eager")));
    // walk down the page so lazy pictures load and scroll-in effects run, then back to the top
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < Math.min(total, MAX_HEIGHT); y += s.height / 2) {
      await page.evaluate((y) => window.scrollTo(0, y), y);
      await page.waitForTimeout(120);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
    await page.evaluate(async () => {
      await document.fonts.ready;
      const loaded = (i) => new Promise((r) => (i.addEventListener("load", r), i.addEventListener("error", r)));
      const late = [...document.images].filter((i) => !i.complete).map(loaded);
      await Promise.race([Promise.all(late), new Promise((r) => setTimeout(r, 8000))]);
    });
    await page.waitForTimeout(400);
    const height = Math.min(MAX_HEIGHT, await page.$eval("#snap", (e) => Math.ceil(e.getBoundingClientRect().height)));
    const path = `${OUT}${id}.${s.kind}.jpg`;
    await page.screenshot({ path, type: "jpeg", quality: 66, fullPage: true, clip: { x: 0, y: 0, width: s.width, height } });
    console.log(`${id}.${s.kind}.jpg  ${height}px tall`);
    await ctx.close();
  }
}

await browser.close();
