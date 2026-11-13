# Neon setup and database readiness

## Current state (November 13, 2026)

- The app is live on Neon Postgres. Production on Vercel reads the pooled `DATABASE_URL` from Vercel's environment variables (Production and Preview). That is the source of truth for which Neon project and branch the app uses.
- The tables were created by pasting `db/neon-setup.sql` into the Neon SQL Editor. The database started empty: nothing was copied from InsForge, which was already down (503).
- The browser never connects to Neon. It calls `/api/records/<table>` (rewritten by `vercel.json` to `api/records.ts`), `/api/settings/title`, `/api/access/*` and `/api/health/database`. All of them use the pool in `server/database.ts`, which uses `db/pool.ts`.
- An earlier attempt linked a Neon CLI project (`.neon` / `neon.ts`, project `hidden-dream-48165023`) in offline mode. That was never connected and is **not** what the app uses; `neon.ts` and the `@neon/*` packages were removed. Don't re-link a Neon CLI project or create a new one without the user asking.

No Neon credentials or connection strings belong in this document, source control, or chat. `.env`, `.env.local` and `.neon` are ignored by Git. Never rename `DATABASE_URL` to a `VITE_*` variable.

## Connection strings

From Neon: your project, then **Connect**.

| Variable | Which string | Used by |
|---|---|---|
| `DATABASE_URL` | **Pooled** (host contains `-pooler`) | The app (Vercel and `npm run dev`) |
| `DATABASE_URL_UNPOOLED` | **Direct** (no `-pooler`) | Only `npm run db:migrate` |

## Changing the schema

The schema lives in `migrations/*.sql`, applied in the order listed in `server/migrations.ts`. Every migration must be additive (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`). Never edit a migration that has already been applied: the runner stores a checksum and refuses changed files. Add a new file instead.

After adding a migration:

1. Add its file name to `migrationFiles` in `server/migrations.ts`.
2. Run `npm run db:schema-sql` to regenerate `db/neon-setup.sql`, and commit both.
3. Apply it to Neon, either by pasting `db/neon-setup.sql` into the Neon SQL Editor (safe to run again; it records the same checksums), or with `DATABASE_URL_UNPOOLED` set in `.env`: `npm run db:migrate`.
4. Check: `npm run db:check`, or open `/api/health/database` on the site; it should return `{"status":"ready"}`.

Never run `schema.sql`. It starts with `DROP TABLE` and erases data.

## Branches for testing or a second app

A Neon branch is an instant copy of the database. Use one for risky testing, or for the separate operations "command center" app, so the two can't overwrite each other's data. **Reset from parent** refreshes a branch with the latest data and overwrites the branch.
