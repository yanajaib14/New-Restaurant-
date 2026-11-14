## Change
Run `npm ci`, `npm test` (including TypeScript checking), and `npm run build` on every push and pull request. Use Node.js 24 with npm lockfile caching and a read-only GitHub token. The workflow does not require database credentials or deploy the application.

## Validation
- Workflow YAML parsed locally.
- `npm test`: 38 tests passed.
- `npm run build`: passed, existing large-bundle warning.
- Existing browser suites: 31 mocked scenario groups passed.
- Local PostgreSQL application browser suite: 4 scenarios passed.
- GitHub-hosted workflow execution has not yet been verified.
