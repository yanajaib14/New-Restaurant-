-- To-dos get the same High / Medium / Low priority that master tasks already have,
-- so the mobile task board can colour-code every card. Additive and safe to re-run.
ALTER TABLE task_todos
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'Medium';
