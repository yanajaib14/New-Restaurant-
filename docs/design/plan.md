# Approved design polish plan

The owner approved this scope in chat before implementation. Google Drive removal and CI remain separate changes. Visual work preserves existing save handlers and data flow.

## What the baseline shows

[21 before screenshots and measurements](before/manifest.json) cover seven main desktop pages at 1440×1000 and all four mobile screens plus task/event/update editors at **390×844 and 375×667**. They use isolated layout fixtures: no production records, business writes or settings writes. External fonts were blocked, so fallback fonts appear.

There was no horizontal overflow. However, mobile card text is 12–14px, status buttons are 33px high, and Calendar has 38 controls below 44px at each phone size. The task editor exposes nine controls, extending below the viewport. Calendar has duplicate Add event actions; its month arrows visibly compress. These are the first mobile fixes.

## Proposed scope

**Keep the current clean black-and-white desktop direction and iOS-like mobile feel.** Keep the existing logo, font families and priority/error meanings. No UI framework, Tailwind version change, invented records or new features.

Start with `T`, `UI.tsx` and `src/index.css`: consistent spacing, heading/body weights, card borders/radii, buttons, inputs, muted-text contrast, empty/loading/error states and keyboard focus. Then fix individual desktop pages. Preserve current navigation destinations, record ordering, calculations and data flow. No count-rule changes, task unification or new dashboard information in this pass.

### Mobile stays simple

Below **1024px**, exactly **Today, Tasks, Calendar, Updates**. No extra tabs, menus, sections, charts, tables or horizontal work columns. Menu costing, financials, inventory, vendors, permits, hiring, onboarding, settings and AI remain desktop-only. The monthly calendar retains its necessary seven-day grid.

| Screen | Polish within existing content |
|---|---|
| Today | Readable, short card list; one prominent New task button after the content. No extra metrics or sections. |
| Tasks | Keep To do / Needs review / Done stacked vertically, with existing secondary record actions. One New task button. |
| Calendar | Keep month and selected-day preview. One Add event button. Reduce calendar padding/gaps so days and arrows can reach 44×44px without sideways scrolling. |
| Updates | Keep update cards and one New update button. Improve wrapping and empty/error states. No new inbox or push setup; keep notification limitations honest. |

Make every interactive target **at least 44×44px**, including close buttons and secondary actions. Body text and inputs must be **at least 16px**; compact navigation captions remain within full-size targets. Aim for WCAG AA contrast, visible focus and reduced-motion support.

Use short mobile presentations of existing editors: task title with optional due date/priority; todo title/status and a short note where needed; event title/date with optional time; update text only. Detailed fields remain desktop-only. Reuse confirmed-save handlers and preserve unshown existing values, pending guards and failed drafts. Do not introduce new saving behavior.

Apply safe-area spacing to the entire mobile shell, banners and modals. Reserve the fixed bottom bar plus `env(safe-area-inset-bottom)` and account for the top inset. Ensure the final card, focused input and save action remain reachable after scrolling. Never hide overflow to mask oversized content.

If any other feature seems to need mobile access, describe it and **ask the owners first**.

## Verification and delivery after approval

- Separate PRs: shared styles first, then page-specific polish only if needed. Owner reviews Vercel previews; no agent merge, direct deployment or production data changes.
- Run `npm test`, `npm run build`, browser suites and the local PostgreSQL application suite. Change selectors only when visible text/structure changes.
- Test 390×844, 375×667, 768px (mobile), 1024px and 1440px (desktop). Assert four mobile tabs, no desktop tools, target/text sizes, wrapping, overflow and bottom-bar clearance. Check empty/loading/error states.
- Capture matching desktop/mobile images in `docs/design/after/` using the same fixtures, filenames and viewport sizes. After screenshots are pending, not represented by unchanged baseline images.
- Chromium cannot simulate the safe-area insets here. Physical iPhone notch, home bar, browser chrome and keyboard behavior require owner/device review; headless viewport testing alone cannot prove them.

**Approved scope:** this limited polish pass only. No richer mobile dashboard or additional mobile feature is authorized.
