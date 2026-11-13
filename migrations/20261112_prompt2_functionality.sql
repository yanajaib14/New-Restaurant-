-- Shared team onboarding definitions and shopping list removal state.
-- Access follows the application's current open access model; this migration
-- does not add or imply authorization or row-level security.
CREATE TABLE IF NOT EXISTS team_onboarding (
  id integer PRIMARY KEY CHECK (id = 1),
  roles jsonb NOT NULL DEFAULT '[]'::jsonb,
  rule_categories jsonb NOT NULL DEFAULT '[]'::jsonb,
  completion jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE shopping_list_items
  ADD COLUMN IF NOT EXISTS removed boolean NOT NULL DEFAULT false;
