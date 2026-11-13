# Shared data recovery

This implementation was rebuilt from base commit `66af2a4`; the previous environment's uncommitted implementation was unavailable. Tests in this checkout are new evidence, not recovered historical results.

Successful empty task, note, checklist and todo reads replace browser backups. Failed reads retain existing state rather than pretending that an empty shared workspace was loaded.

Only **todos** have a durable offline write queue. Each intent has its own localStorage key, a stable numeric record ID, and an ordered timestamp. The rendered rows overlay unacknowledged intents onto the latest confirmed server rows. Each pending row says “Pending — only on this device”; the workspace banner distinguishes loading, syncing, shared, offline and error. The Retry button, reconnect, focus and a 15-second poll attempt synchronization. Other record types keep failed editor drafts and report failures; they do not have this queue.

Web Locks serializes todo flushing across tabs in one browser. A browser without Web Locks keeps changes queued and reports the limitation. Independent browser devices still use the server's last-write behavior: this is not field-level conflict resolution, versioned transactions, or person-specific authorization. Explicit numeric primary keys prevent duplicate inserts after a lost response; an insert whose response was lost is updated after the next authoritative read. Acknowledgements persist the cache before removing an intent. Storage errors are surfaced before a write can be shown as safely queued.

Tests: `node --import tsx --test tests/todo-sync.test.ts` and `node tests/workspace.browser.mjs`. Browser tests mock business APIs and block every external destination. They validate local application logic and shared mock storage, not production database policies or real device delivery.
