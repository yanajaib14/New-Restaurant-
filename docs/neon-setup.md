# Neon setup and database readiness

## Current state

The app's code is prepared for Neon Postgres; live Neon deployment remains blocked. The checkout's ignored `.neon` file pins organization `org-royal-dust-97119861`, project `hidden-dream-48165023`, and branch `production`. The app uses its existing Express/Vercel API handlers with `pg`; it does not connect to Neon from the browser and does not need Neon's Data API. App reads and writes use the pooled `DATABASE_URL`. Schema migrations use the direct, unpooled `DATABASE_URL_UNPOOLED`.

The Neon CLI is usable through `npx neon@9.4.0`; installing it globally failed because the environment does not permit the required write outside the workspace. Neon skills were installed into this checkout. The project is pinned, but authentication and environment retrieval are not complete: `neon init` reported that it linked `.neon` and created `neon.ts` in offline mode, explicitly saying nothing was verified. The attempted `neon deploy` could not complete the Neon API request; the environment's network allowlist was still empty at revision 1 when checked. No usable database connection URLs have been pulled into `.env.local`, so live Neon connectivity and schema readiness remain unverified.

No Neon credentials, connection URLs, or secret values belong in this document, source control, or chat. `.env.local`, `.env`, and `.neon` are ignored by Git. Keep `DATABASE_URL` server-side; never rename it to a `VITE_*` variable.

The old InsForge database was not modified. No records were copied from it, no production data was used to seed Neon, no Neon migration has been applied, and no frontend deployment was made as part of this setup.

## Setup once Neon access is available

These steps require a human Neon sign-in. Do not try to complete browser OAuth from an unattended agent. Run commands from the repository root.

1. Save the proposed network changes in environment settings. Publish the environment when ready to retain this configuration for future tasks. Resolve the environment's network access for the Neon sign-in and console flow (`oauth2.neon.tech`, `console.neon.tech`, and `neon.com` were among the relevant hosts); then authenticate in the user's browser:

   ```sh
   npm_config_cache=/workspace/.npm-cache npx --yes neon@latest login --config-dir /workspace/.neon-cli
   ```

2. Confirm `.neon` still points to the intended production branch before applying configuration. This workspace already has `.neon` and `neon.ts`; do not reinitialize or select a new project. Apply the current declared Neon configuration:

   ```sh
   npm_config_cache=/workspace/.npm-cache npx --yes neon@latest deploy --config-dir /workspace/.neon-cli
   ```

   The requested database service is Postgres. `neon.ts` keeps Neon Auth disabled. This command applies Neon configuration; it is not a frontend deployment.

3. Pull branch environment variables locally and keep the generated connection values private:

   ```sh
   npm_config_cache=/workspace/.npm-cache npx --yes neon@latest env pull --file .env.local --config-dir /workspace/.neon-cli
   ```

   The server expects a pooled `DATABASE_URL` for app requests and a direct, unpooled `DATABASE_URL_UNPOOLED` for migrations. Do not print `.env.local` to terminal output or copy its values into chat. The local file is ignored by Git.

4. Apply the checked-in, additive migrations to the selected Neon branch:

   ```sh
   npm run db:migrate
   ```

   The runner in `scripts/migrate.ts` refuses to run without `DATABASE_URL_UNPOOLED` and rejects a pooled endpoint. It applies `migrations/0001_neon_baseline.sql`, then `migrations/20261112_prompt2_functionality.sql`, recording checksums in `app_schema_migrations`. It does not import records or insert seed restaurant data.

5. Check the connection and required schema:

   ```sh
   npm run db:check
   curl -i http://127.0.0.1:4173/api/health/database
   ```

   `db:check` requires `DATABASE_URL` and checks Postgres plus required application tables. The HTTP readiness endpoint returns `503` when the URL is absent, the connection fails, or migrations are still required. A successful local check establishes database connectivity and schema readiness only; it does not prove authentication, workspace authorization, push delivery, or cross-device app behavior.

6. For Vercel runtime, configure the pooled `DATABASE_URL` as a server-side project environment variable for the appropriate deployment environment. Add `DATABASE_URL_UNPOOLED` only to a protected migration job if migrations will run there; the app runtime does not need it. Then verify the deployed `/api/health/database` endpoint returns `200` with `status: "ready"`. This is a separate backend configuration step and does not authorize publishing a frontend deployment.

Do not run `schema.sql`: it contains destructive reset statements. Use only the versioned migration runner above.

## Attempts and observed blockers

| Attempt | Observed result |
|---|---|
| `npm i -g neon@latest` | Failed because the managed environment cannot write to the global install location outside the workspace. Output began `npm error code ENOENT`, `npm error syscall mkdir`, `npm error path /home/agent/.local/lib`. Use `npx` instead. |
| `npx neon@9.4.0` | CLI invocation worked; the project target in `.neon` is available locally. |
| Neon skill/plugin CLI setup | A plugin install attempt failed with `ENOENT: no such file or directory, mkdir '/home/agent/.cache/plugins'`. The Neon and Neon Postgres skills were subsequently installed locally with workspace-scoped cache/config paths. |
| `neon init` | Output included `Linked .neon`, `Written offline (--no-checks): nothing was verified.`, and `Config neon.ts created`. This records local files only; it did not verify the account, project, branch, or database. |
| `npm_config_cache=/workspace/.npm-cache npx --yes neon@latest deploy --config-dir /workspace/.neon-cli` | Blocked before configuration/environment retrieval with `ERROR: Could not reach the Neon API. Please check your internet connection and try again. If your connection is fine and this keeps happening, check https://neonstatus.com for ongoing incidents.` Probes to `console.neon.tech/api/v2` and `oauth2.neon.tech/.well-known/openid-configuration` returned `curl: (56) CONNECT tunnel failed, response 403` and HTTP `000`. The network allowlist was still empty at revision 1. No `DATABASE_URL` was produced. |

Retry only after the Neon sign-in and network route work. Do not create a replacement project or change the pinned organization, project, or branch to work around the 403.

## Validation already performed

The migration runner and Express CRUD API were exercised together against actual local PostgreSQL through PGlite; additional API unit tests use isolated mocks. `npm test` passed 38 tests, mocked browser checks passed 31 scenario groups, lint passed, and `npm run build` completed in 2.77 seconds with a 751.06 kB JavaScript bundle warning. The local app responds on port 4175, but `/api/health/database` returned `503 {"status":"unavailable","error":"DATABASE_URL is not configured"}`. `npm run db:check` reports that `DATABASE_URL` is missing, and `npm run db:migrate` reports that `DATABASE_URL_UNPOOLED` is missing. These checks do not connect to the target Neon project. Live Neon query, migration application, Vercel environment setup, and deployed readiness are still pending.

The app still uses a shared guest Owner identity. Neon Postgres setup alone does not provide sign-in or secure partner authorization; do not describe the current browser PIN as server authorization.

## Full app check against local PostgreSQL

`npm run test:database-app` builds the app and runs its compiled mobile UI through the real Express API into an isolated local PGlite PostgreSQL database. Four scenarios passed: the mobile shell, task creation/review/completion after reload, update posting after reload, and calendar event creation after reload. The runs made real local records-API writes, recorded no page errors, and used no mocked business APIs. External HTTP was blocked. This is additional local evidence; it does not replace the blocked live Neon check.

Installed guidance: [.agents/skills/neon/SKILL.md](../.agents/skills/neon/SKILL.md) and [.agents/skills/neon-postgres/SKILL.md](../.agents/skills/neon-postgres/SKILL.md). We retained `pg`, use a bounded pooled connection for Node/Express, attach it to Vercel Fluid runtime when applicable, and use the direct connection for migrations.
