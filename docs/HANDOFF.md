# Next-agent handoff

## Starting point

- Rebuilt from recovery base `66af2a4`; the previous cloud environment's uncommitted work was not recovered. Treat the current code and tests as rebuilt work, not historical recovery.
- This work has been merged into `main`. Develop on branches and open pull requests; `main` deploys to production on Vercel.
- Read `AGENTS.md`, `docs/recovery-status.md`, `docs/functionality-audit.md`, `docs/shared-data-sync.md`, `docs/testing.md`, and `docs/neon-setup.md` before changing code.
- Do not run `schema.sql`; it contains destructive reset statements. Do not deploy/publish frontend code, import old database records, or change production data without user authorization.

## Neon: connected (November 13, 2026)

Neon setup is done; the earlier blocked CLI steps no longer apply. The app is merged to `main` and deployed on Vercel with a pooled `DATABASE_URL`, and the tables were created from `db/neon-setup.sql`. The `restaurant-neon-handoff` work was merged on top of that, keeping one data layer (`/api/records`, `server/database.ts` -> `db/pool.ts`) and one schema source (`migrations/`). The unused Neon CLI link (`neon.ts`, project `hidden-dream-48165023`) was removed. See `docs/neon-setup.md` for how to change the schema.

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
