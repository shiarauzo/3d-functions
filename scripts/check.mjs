import puppeteer from "puppeteer";

const URL = process.env.URL || "http://localhost:4173/";
const EXPECTED_CELLS = Number(process.env.EXPECTED_CELLS || 12);

// Prefer the real GPU (fast); fall back to SwiftShader if requested.
// HEADFUL=1 launches a real window (uses the machine GPU — needed for the
// screenshot, since headless here falls back to slow software rendering).
const SOFTWARE = process.env.SOFTWARE === "1";
const HEADFUL = process.env.HEADFUL === "1";
const browser = await puppeteer.launch({
  headless: HEADFUL ? false : "new",
  protocolTimeout: 240000,
  args: SOFTWARE
    ? [
        "--use-gl=angle",
        "--use-angle=swiftshader",
        "--enable-unsafe-swiftshader",
        "--ignore-gpu-blocklist",
        "--no-sandbox",
      ]
    : [
        "--enable-gpu",
        "--ignore-gpu-blocklist",
        "--enable-unsafe-swiftshader",
        "--no-sandbox",
      ],
});

const page = await browser.newPage();
await page.setViewport({
  width: Number(process.env.VW || 1280),
  height: Number(process.env.VH || 1000),
  deviceScaleFactor: 1,
});

const errors = new Set();
page.on("console", (m) => {
  if (m.type() === "error") errors.add(m.text());
});
page.on("pageerror", (e) => errors.add(e.stack || String(e)));

await page.goto(URL, { waitUntil: "networkidle0", timeout: 30000 });
await new Promise((r) => setTimeout(r, 2500));

const snapshot = () =>
  page.evaluate(() => {
    const canvases = Array.from(document.querySelectorAll("canvas"));
    const gl = canvases.map((c) => {
      const ctx = c.getContext("webgl2") || c.getContext("webgl");
      return { lost: ctx ? ctx.isContextLost() : true };
    });
    return {
      cells: document.querySelectorAll(".cell").length,
      mounted: canvases.length,
      lost: gl.filter((g) => g.lost).length,
    };
  });

// Screenshots are opt-in (SHOT=1): capturing >~9 heavy WebGL canvases stalls
// under headless software rendering. Routine QA gates on contexts + errors;
// visual review happens on a real GPU.
const shoot = async (path) => {
  if (!process.env.SHOT) return false;
  try {
    await Promise.race([
      page.screenshot({ path }),
      new Promise((_, rej) => setTimeout(() => rej(new Error("shot timeout")), 90000)),
    ]);
    return true;
  } catch {
    return false;
  }
};

// scroll through the page to exercise lazy mount / unmount
let maxMounted = 0;
let everLost = 0;
const top = await snapshot();
maxMounted = Math.max(maxMounted, top.mounted);
const shotOk = await shoot("scripts/shot.png");
const height = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y <= height; y += 500) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await new Promise((r) => setTimeout(r, 350));
  const s = await snapshot();
  maxMounted = Math.max(maxMounted, s.mounted);
  everLost = Math.max(everLost, s.lost);
}

// hover a cell to capture the focus state
await page.evaluate(() => window.scrollTo(0, 0));
await new Promise((r) => setTimeout(r, 400));
try {
  const cells = await page.$$(".cell");
  if (cells[2]) {
    await cells[2].hover();
    await new Promise((r) => setTimeout(r, 1200));
    await shoot("scripts/shot-hover.png");
  }
} catch {
  /* hover is best-effort */
}

let captions = -1;
try {
  captions = await page.evaluate(
    () => document.querySelectorAll(".caption .katex").length,
  );
} catch {
  /* best-effort */
}

await browser.close();

const report = {
  cells: top.cells,
  captions,
  maxMountedAtOnce: maxMounted,
  everLostContext: everLost,
  shotOk,
  errors: [...errors],
};
console.log(JSON.stringify(report, null, 2));

if (errors.size) process.exit(2);
if (top.cells !== EXPECTED_CELLS) process.exit(3);
if (everLost > 0) process.exit(4); // a context was lost (limit exceeded) -> blank
if (maxMounted > 16) process.exit(5); // over the browser context budget
