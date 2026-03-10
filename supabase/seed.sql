-- Mission Control Agent Bootstrap Seed
-- Idempotent INSERT for our 5-agent team

INSERT INTO agents (id, name, role, avatar_emoji, status, is_master, workspace_id, model, source, gateway_agent_id, created_at, updated_at)
VALUES 
  ('sherlock', 'Sherlock', 'coordinator', '🔍', 'standby', false, 'default', 'anthropic/claude-sonnet-4-6', 'local', 'sherlock', now(), now()),
  ('edison', 'Edison', 'architect', '💡', 'standby', false, 'default', 'anthropic/claude-opus-4-6', 'local', 'edison', now(), now()),
  ('nikola', 'Nikola', 'analyst', '⚡', 'standby', false, 'default', 'anthropic/claude-sonnet-4-6', 'local', 'nikola', now(), now()),
  ('newton', 'Newton', 'developer', '🍎', 'standby', false, 'default', 'anthropic/claude-haiku-4-5', 'local', 'newton', now(), now()),
  ('scout', 'Scout', 'ops', '🐕', 'standby', false, 'default', 'anthropic/claude-haiku-4-5', 'local', 'scout', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Default Workflow Template
INSERT INTO workflow_templates (id, workspace_id, name, stages, fail_targets, is_default, created_at, updated_at)
VALUES (
  'default-workflow-default',
  'default',
  'Default Workflow',
  '[
    {"status": "inbox", "label": "Inbox", "role": null},
    {"status": "in_progress", "label": "Building", "role": "developer"},
    {"status": "testing", "label": "Testing", "role": "analyst"},
    {"status": "review", "label": "Review", "role": "analyst"},
    {"status": "done", "label": "Done", "role": null}
  ]'::jsonb,
  '{"testing": "in_progress", "review": "in_progress"}'::jsonb,
  true,
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;
