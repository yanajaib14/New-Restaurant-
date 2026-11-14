## Change
Remove the Google Drive integration, as requested by the owner. Its Connect Drive control was visible on Vercel while its OAuth/upload routes existed only in the local Express server. Notes now keep their existing attachment preview and local download actions without offering an unavailable export.

Remove the Drive-only client, server routes, dependencies and example environment settings. No Neon schema, pool, API rewrites, saving logic, mobile layout or visual styling changes are included.

## Validation
- `npm test`: 38 tests passed, including TypeScript checking.
- `npm run build`: passed (existing large-bundle warning).
- Existing browser suites: 31 scenario groups passed.
- New read-only Drive-removal regression: passed; no Google requests/controls, original attachment filename and contents download, zero business writes.
- Local PostgreSQL app browser suite: 4 scenarios passed.
- No production records or live database calls were used.
