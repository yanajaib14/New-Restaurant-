# Workspace recovery — November 13, 2026

The available checkout was branch `work` at `66af2a4577ed1adeba86332774ca9233c94a6a34`, the originally selected main revision. It had a clean working tree. Inspection of available workspace/shared/download/scratch folders, stash, branches, reflog and unreachable Git objects found no prior uncommitted implementation or test suite. The historical handoff is not proof those changes exist here.

Recovered input: the original “Launch Dashboard — Improvement Plan for Codex” attachment was downloadable. The user continuation handoff is also retained under `/workspace/attachments`. No production data was used as recovery material.

Before edits, the base was preserved outside the checkout in `/workspace/recovery/restaurant-base.bundle` and `/workspace/recovery/restaurant-base-files.tar.gz`. Rebuilt work remains local to this checkout; deployment, publication, merging and production migrations are not authorized or performed.

Rebuilt work and actual validation are recorded in `functionality-audit.md`, `shared-data-sync.md` and `onboarding-recovery.md`. Earlier claims of 11 sync tests, 8 notification tests, and all historical browser suites must not be carried forward as current evidence. Current tests must be run from this checkout.

The old notification implementation and local VAPID configuration were not recovered. Do not claim Web Push, an inbox, authenticated recipients, or closed-app delivery works. Individual accounts and backend workspace permissions remain a later stage. The current app still creates a guest Owner identity. The device PIN is a convenience lock, and confidential hiring data remains loaded before that screen unlocks. This is not secure partner access.

The migration in `migrations/20261112_prompt2_functionality.sql` is additive and unapplied. Never use `schema.sql` as a migration: it includes destructive reset statements.

Final checkpoint validation: 21 unit tests and 31 mocked browser scenario groups passed; TypeScript checking and production build passed (large bundle warning remains). The complete rebuilt source and new files are preserved in `/workspace/recovery/restaurant-rebuilt-files.tar.gz`; tracked changes are also in `/workspace/recovery/restaurant-rebuilt.patch`. These are local recovery artifacts, not GitHub persistence or publication.

Neon follow-up: code now uses the same-origin records API backed by server-only Neon connection variables. The previous provider client and hardcoded browser configuration were removed. Schema DDL was moved from server startup to explicit additive migrations. Neon init linked the requested project offline; live deploy, env retrieval and target-database tests remain blocked by network policy and sign-in. New validation: 38 automated tests, 31 mocked browser groups, and four compiled-App → real Express → local PostgreSQL browser groups passed. See `neon-setup.md`; this does not establish live Neon readiness.
