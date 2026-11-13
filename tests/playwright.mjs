// Loads Playwright for the browser tests from wherever it is installed:
// PLAYWRIGHT_MODULE (a path) if set, otherwise normal Node resolution
// (a local or global `playwright` install, including NODE_PATH).
import { createRequire } from 'node:module';

export async function loadPlaywright() {
  if (process.env.PLAYWRIGHT_MODULE) return import(process.env.PLAYWRIGHT_MODULE);
  try {
    return createRequire(import.meta.url)('playwright');
  } catch {
    throw new Error('Playwright is not installed. Run `npm i -D playwright && npx playwright install chromium`, or set PLAYWRIGHT_MODULE.');
  }
}
