# Next-agent handoff

## Starting point

- Rebuilt from recovery base `66af2a4`; the previous cloud environment's uncommitted work was not recovered. Treat the current code and tests as rebuilt work, not historical recovery.
- This work has been merged into `main`. Develop on branches and open pull requests; `main` deploys to production on Vercel.
- Read `AGENTS.md`, `docs/recovery-status.md`, `docs/functionality-audit.md`, `docs/shared-data-sync.md`, `docs/testing.md`, and `docs/neon-setup.md` before changing code.
- Do not run `schema.sql`; it contains destructive reset statements. Do not deploy/publish frontend code, import old database records, or change production data without user authorization.

## Neon: connected (November 13, 2026)

Neon setup is done; the earlier blocked CLI steps no longer apply. The app is merged to `main` and deployed on Vercel with a pooled `DATABASE_URL`, and the tables were created from `db/neon-setup.sql`. The `restaurant-neon-handoff` work was merged on top of that, keeping one data layer (`/api/records`, `server/database.ts` -> `db/pool.ts`) and one schema source (`migrations/`). The unused Neon CLI link (`neon.ts`, project `hidden-dream-48165023`) was removed. See `docs/neon-setup.md` for how to change the schema.

## Approved design checkpoint (November 14, 2026)

Work continues from current `main` (`bb951fa`) on `mobile-design-plan`. The owner approved the plan before implementation and separately approved Drive removal. The current order is Drive removal → CI → approved design polish → owners' opening-day must-haves. This supersedes the older order that put design last.

This branch changes presentation only: shared UI/theme/focus/contrast, desktop header spacing and simple mobile cards/editors. Mobile remains exactly Today, Tasks, Calendar, Updates; detailed tools stay desktop-only. Compact editors preserve hidden values and reuse existing save handlers. No database, schema, pool, API rewrite or Neon project configuration changes are included.

Review [the before/after gallery](design/README.md), [measurements and validation](design/results.md), and [approved plan](design/plan.md). There are 21 baseline and 48 after captures, including both required phones, 768/1024/1440 widths, states and CSS safe-area simulations. Physical iPhone notch/home-bar/browser-keyboard behavior still needs device review.

Separate pushed branches: `remove-google-drive` (`42c0e6f`) and `ci-test-build` (`b295537`). They are not included in this branch. GitHub API requests are forbidden by the environment, so automatic PR creation is blocked; compare links and PR bodies are prepared. Do not merge or deploy; the owner reviews previews and merges. No live Neon query or production write was performed. Production schema readiness and editing remain owner checks; do not re-link Neon or run SQL.

Open the three independent PRs against `main` using these compare links and prepared descriptions:

- [Remove Google Drive](https://github.com/yanajaib14/New-Restaurant-/compare/main...remove-google-drive?expand=1) · [description](pr-drafts/remove-google-drive.md)
- [Add CI](https://github.com/yanajaib14/New-Restaurant-/compare/main...ci-test-build?expand=1) · [description](pr-drafts/ci-test-build.md)
- [Approved design polish](https://github.com/yanajaib14/New-Restaurant-/compare/main...mobile-design-plan?expand=1) · [description](pr-drafts/mobile-design-plan.md)

The design source/screenshot commit is `11af502`. These branches were pushed, not merged. Opening-day must-haves were requested from the owners; await their list before reprioritizing functional work. The overdue-count disagreement, implicit dependencies, guest identity and confidential hiring records loading before PIN unlock remain open. This visual pass does not fix authorization or complete the audit.

## Validation evidence

- `npm test`: 38 automated tests passed.
- `npm run test:browser`: 31 mocked browser scenario groups passed. These mock business APIs and do not verify live persistence or permissions.
- `npm run test:database-app`: 4 compiled-App → Express → local PGlite/PostgreSQL browser scenarios passed. This exercises actual SQL and app CRUD against local isolated storage, not Neon.
- `npm run lint`: passed.
- `npm run build`: passed; the generated JavaScript bundle is about 751 kB and produces a large-bundle warning.
- Local `/api/health/database` remains unavailable without `DATABASE_URL`. No Neon query, migration, Vercel environment, or deployed readiness has passed yet.

Rerun current checks before reporting any new completion. Never reuse older historical test counts.

## Product and unfinished work

The user is two restaurant owners collaborating from different locations. Mobile should remain a simple iOS-like workspace with Today, Tasks, Calendar, and Updates; keep detailed tools on desktop. The mobile surface is rebuilt, but physical iPhone behavior and closed-app push delivery are not verified. QuickBooks stays a clearly marked placeholder only; do not build invoicing, receipts, bookkeeping, or a QuickBooks integration. Menu costing remains a launch-planning tool.

Prompt 2's full functionality audit is still incomplete. Follow the source brief's remaining sequence:

1. Complete untested Prompt 2 controls and fix overdue-count/calendar/status issues.
2. Implement individual accounts and server-side permissions before claiming partner privacy.
3. Unify tasks and review workflow; make dependencies explicit; then improve the desktop operating summary.
4. Finish permits/expiry reminders, exports, honest counts, and a Handover page.
5. Build personal settings and authenticated partner notifications/Nudge; verify real closed-app phone delivery before claiming push works.
6. Finish menu costing and simplify Operations around canonical inventory and one shopping view; no duplicate inventory records.
7. Ground the AI assistant in real app data and require review before saves or sends.
8. Finish visual design polish after functional work is verified.

Known limits to repeat clearly: the app still uses a shared guest Owner identity; PIN is only a browser convenience lock, not authorization; confidential hiring data currently loads before PIN unlock; person-specific notifications, push inbox and closed-app push were not recovered or implemented. Do not invent owners, dates, restaurant records, menu prices, vendors, or policies. For delegated straightforward work, use smaller/cheaper models as the user requested.
