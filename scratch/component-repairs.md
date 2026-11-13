# Component repairs evidence

## Changes

- `Team.tsx`: Talent hiring deletion callbacks now receive full `Position` / `Candidate` values, matching App's confirmation labels and delete handlers. Position and candidate forms use `useDraftSave` to prevent duplicate writes, keep drafts open on false/rejected saves, show inline errors, and block dismissal while pending. Offer letters and resumes are read into data URLs so attachment values survive reloads.
- `Enhancements.tsx`: proposed task creates only show Added after an explicit `true`; pending creates disable repeats and false/rejected writes show retry text. Inspiration quick-add and task detail status actions await `Promise<boolean>` and close only after confirmed success; both use draft-save pending/error/close behavior.

## Verification

- Read-only App call-site review confirmed TalentHiring callbacks consume object `.role` / `.name` for confirmation labels and IDs for deletion.
- `npm run lint` was run after the component edits. JSX parsing passed, but the full typecheck currently reports App callback return-type mismatches awaiting parent changes and an unrelated `src/hooks/useTodoSync.ts` `TaskTodoItem` / `Record<string, unknown>` error.
- Not verified: browser behavior, attachment size limits, persistence of large data URLs in the backing store.
