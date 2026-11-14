## Change

Refine the existing desktop header, shared controls, contrast and focus styles. Keep mobile limited to Today, Tasks, Calendar and Updates, with 16px body/input text, 44px targets, one primary action after content and short editors that retain hidden values. The owner approved the plan before implementation.

No data layer, schema, Neon configuration, save handlers, dependencies or desktop tools on mobile are added. CI and Drive removal are separate branches.

## Validation

- `npm test`: 38 passed, including TypeScript checking.
- `npm run build`: passed; existing large-chunk warning (752.31 kB).
- `npm run test:browser`: 31 scenario groups passed.
- `npm run test:database-app`: 4 compiled-app/local PostgreSQL scenarios passed.
- 48 screenshot/layout scenarios passed at 375/390/768/1024/1440 widths: no horizontal overflow or mobile controls below 44px, four mobile destinations, short editors, focus and final action clearance. Includes empty/loading/error states and CSS safe-area simulations.
- No production requests or writes. Physical iPhone behavior and live Neon editing remain unverified.

See `docs/design/README.md` for matching before/after images and `docs/design/results.md` for evidence and limits. Do not merge or deploy automatically; the owner reviews the preview.
