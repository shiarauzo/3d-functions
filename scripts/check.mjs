import puppeteer from "puppeteer";

const URL = process.env.URL || "http://localhost:4173/";

const browser = await puppeteer.launch({
  headless: "new",
  args: [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
    "--no-sandbox",
  ],
});

const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 1000, deviceScaleFactor: 1 });

const errors = new Set();
page.on("console", (m) => {
  if (m.type() === "error") errors.add(m.text());
});
page.on("pageerror", (e) => errors.add(e.stack || String(e)));

await page.goto(URL, { waitUntil: "networkidle0", timeout: 30000 });
await new Promise((r) => setTimeout(r, 2500));

const report = await page.evaluate(() => {
  const canvases = Array.from(document.querySelectorAll("canvas"));
  const captions = Array.from(document.querySelectorAll(".caption .katex")).length;
  const gl = canvases.map((c) => {
    const ctx = c.getContext("webgl2") || c.getContext("webgl");
    return { w: c.width, h: c.height, hasGL: !!ctx, lost: ctx ? ctx.isContextLost() : true };
  });
  return { canvasCount: canvases.length, captions, gl };
});

// blank check: sample the first canvas for non-background pixels
const blank = await page.evaluate(() => {
  const c = document.querySelector(".cell canvas");
  if (!c) return true;
  const ctx = c.getContext("webgl2") || c.getContext("webgl");
  if (!ctx) return true;
  const px = new Uint8Array(ctx.drawingBufferWidth * ctx.drawingBufferHeight * 4);
  ctx.readPixels(0, 0, ctx.drawingBufferWidth, ctx.drawingBufferHeight, ctx.RGBA, ctx.UNSIGNED_BYTE, px);
  let nonZero = 0;
  for (let i = 3; i < px.length; i += 4) if (px[i] > 8) nonZero++;
  return nonZero < 50;
});

await page.screenshot({ path: "scripts/shot.png" });
await browser.close();

console.log(JSON.stringify({ ...report, blank, errors: [...errors] }, null, 2));
if (errors.size) process.exit(2);
if (report.canvasCount !== 9) process.exit(3);
