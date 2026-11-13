# Next-agent handoff

## Starting point

- Rebuilt from recovery base `66af2a4`; the previous cloud environment's uncommitted work was not recovered. Treat the current code and tests as rebuilt work, not historical recovery.
- The current handoff branch is `restaurant-neon-handoff`; `main` is intended to remain unchanged. No final commit SHA is recorded here.
- Read `AGENTS.md`, `docs/recovery-status.md`, `docs/functionality-audit.md`, `docs/shared-data-sync.md`, `docs/testing.md`, and `docs/neon-setup.md` before changing code.
- Do not run `schema.sql`; it contains destructive reset statements. Do not deploy/publish frontend code, import old database records, or change production data without user authorization.

## Neon: finish setup before claiming live readiness

The application code is wired to server-side Neon Postgres access through Express/Vercel routes. The ignored `.neon` file targets org `org-royal-dust-97119861`, project `hidden-dream-48165023`, branch `production`; the requested service is Postgres. Neon Auth is disabled in `neon.ts`. The target was not reached: `neon init` linked local config in offline mode and verified nothing; `neon deploy` was blocked by the environment's HTTP 403 network tunnel. No Neon URLs have been pulled, no target migrations have run, and no frontend release was made.

Follow the full command and output record in `docs/neon-setup.md`. Next actions, in order:

1. Save and publish the environment's network allowlist change for Neon sign-in/API hosts. Have the user complete interactive Neon login; do not attempt unattended OAuth. Never print, paste, or request a database URL or other secret in chat.
2. Recheck `.neon` target. It is ignored and will be absent in a fresh Git clone; if missing, link the existing project with `npx --yes neon@latest link --org-id org-royal-dust-97119861 --project-id hidden-dream-48165023 --branch production -y --config-dir /workspace/.neon-cli` (use `npm_config_cache=/workspace/.npm-cache` here). Do not create a replacement project or overwrite `neon.ts`. Then retry the documented `neon deploy` and `neon env pull` commands using workspace-scoped CLI cache/config paths.
3. Keep pooled `DATABASE_URL` server-side for app requests; keep direct/unpooled `DATABASE_URL_UNPOOLED` for migrations only. If configuring Vercel, set the runtime URL in server environment variables; do not use `VITE_*` variables.
4. Confirm the user has authorized applying schema changes to the target branch before running `npm run db:migrate`. The runner applies only `migrations/0001_neon_baseline.sql` and `migrations/20261112_prompt2_functionality.sql`, with checksums. These are additive; no old records are imported.
5. Run `npm run db:check` and verify `/api/health/database` is `200` / `status: "ready"`. For a full app write/reload/read check, use an isolated temporary branch or a separately authorized fixture and cleanup; never write synthetic rows into production without authorization. Record precise results.

Until these steps succeed, describe Neon as wired in code but not connected. Latest local readiness check returned `503` because `DATABASE_URL` is not configured; `db:check` and `db:migrate` correctly stop on missing pooled/direct URLs.

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
