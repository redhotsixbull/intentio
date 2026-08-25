// Drives the running playground (http://localhost:8093) and records a video.
// Usage: node scripts/record-gif.mjs   (playground must be running: pnpm play)
import { chromium } from 'playwright';

const W = 680;
const H = 900;
const URL = 'http://localhost:8093/';

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: 2,
  recordVideo: { dir: 'scripts/vid', size: { width: W, height: H } },
});
const page = await context.newPage();
const wait = (ms) => page.waitForTimeout(ms);

await page.goto(URL);
await wait(1000);

// ── Card 1: same shortcut, different action ──
// Text field → Ctrl/Cmd+A selects text.
await page.click('input');
await wait(700);
await page.keyboard.press('Meta+a');
await wait(1400);

// File list → the SAME shortcut selects files.
await page.getByText('File list — click here', { exact: false }).click();
await wait(700);
await page.keyboard.press('Meta+a');
await wait(1600);

// ── Card 2: one command via button, then via shortcut ──
await page.getByRole('button', { name: /Clear all/ }).click();
await wait(1500);
await page.getByRole('button', { name: /Refill/ }).click();
await wait(900);
await page.keyboard.press('Meta+d'); // same command, via keyboard
await wait(1700);

await context.close(); // flushes the video file
await browser.close();
console.log('done');
