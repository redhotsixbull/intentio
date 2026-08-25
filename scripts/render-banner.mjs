// Renders docs/banner.svg → docs/banner.png (2x) via headless Chromium.
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const svg = readFileSync('docs/banner.svg', 'utf8');
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 380 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();
await page.setContent(`<!doctype html><body style="margin:0;padding:0">${svg}</body>`);
await page.locator('svg').screenshot({ path: 'docs/banner.png' });
await browser.close();
console.log('banner done');
