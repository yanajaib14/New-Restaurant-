# Team onboarding recovery

`TeamOnboarding` now edits the singleton shared `team_onboarding` record supplied by its parent. The component accepts:

```ts
{
  record: any | null;
  onSave: (payload: any) => Promise<boolean>;
  loadError?: string;
}
```

The save payload is `{ id: 1, roles, rule_categories, completion }`. A missing record starts with empty arrays and an empty completion object. Roles and sidework tasks, rule categories and rules, and completion checkboxes are editable in the component; only a confirmed `true` save clears the local draft recovery copy. Failed saves keep the working draft in the page and in browser local storage. A later visit offers an explicit restore or discard choice. When the parent receives a newer shared record while this page has local edits, the component keeps the draft and offers a deliberate reload action; the user can also dismiss the notice and keep editing. The legacy review area displays every sample role, sidework item, rule category, rule title, and rule detail before import.

Previous built-in sample roles and house rules remain in a collapsed review area. They are labeled as illustrative, require an explicit import action, and are never copied into a shared record automatically. Review imported language before publishing it as restaurant policy.

The additive migration `migrations/20261112_prompt2_functionality.sql` creates the single-row data table and adds the shopping list `removed` flag. The migration does not run automatically and was not executed during this recovery. Current backend access remains under the app's existing open access model; this work does not claim secure authorization for either record.


Browser verification run: `node tests/onboarding.browser.mjs` against the local app at `127.0.0.1:4173`. It verified empty first create, failed save and retry, preservation of dirty edits across a focus-triggered background refresh, explicit reload of shared data, and shared data after page reload. All API requests were mocked; `fonts.googleapis.com` was blocked.
