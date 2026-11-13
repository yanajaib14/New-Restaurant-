# Local validation

Start Express + Vite from the checkout with `npm run dev` (port 4173 by default). No database credentials are required for local preview. Do not configure a production DATABASE_URL merely to run tests: normal server startup contains schema writes.

Run (`npm test` and `npm run test:browser` are shortcuts for the corresponding suites):

```sh
npm run lint
npm run build
node --import tsx --test tests/*.test.ts
node tests/workspace.browser.mjs
node tests/forms.browser.mjs
node tests/core-workspace.browser.mjs
node tests/onboarding.browser.mjs
node tests/mobile-workspace.browser.mjs
```

Browser tests require Playwright and Chromium. In this prepared environment Playwright is installed outside the checkout at `/workspace/.onboarding-tools/node_modules/playwright/index.mjs` and Chromium is `/usr/bin/chromium`. Set `PLAYWRIGHT_MODULE` and `CHROMIUM_PATH` for `workspace.browser.mjs` when using other paths. The tests intercept business requests, store synthetic fixtures only in memory, abort external HTTP destinations and route realtime sockets to inert in-memory handlers. No production records are read or changed. Their persistence and cross-browser evidence describes the mock server, not production SQL/RLS/realtime delivery.

The repository does not yet have a general React component test framework. The Node test runner uses the existing `tsx` dependency; no extra application dependencies are required for unit tests. A large frontend bundle warning is currently expected from the production build.

Neon migration checks: `npm test` now includes real PostgreSQL schema/API tests using PGlite (38 tests total), while `npm run test:database-app` runs four additional browser scenarios through the compiled app and real local API/database. These do not contact live Neon. After authenticated deployment supplies the URLs, `npm run db:migrate`, `npm run db:check`, and `/api/health/database` are the required live checks. See `neon-setup.md` for the current network/authentication blocker.
