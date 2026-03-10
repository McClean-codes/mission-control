import { supabase } from '@/lib/db';

const OUR_AGENTS = [
  {
    id: 'sherlock',
    name: 'Sherlock',
    role: 'coordinator',
    avatar_emoji: '🔍',
    model: 'anthropic/claude-sonnet-4-6',
    gateway_agent_id: 'sherlock'
  },
  {
    id: 'edison',
    name: 'Edison',
    role: 'architect',
    avatar_emoji: '💡',
    model: 'anthropic/claude-opus-4-6',
    gateway_agent_id: 'edison'
  },
  {
    id: 'nikola',
    name: 'Nikola',
    role: 'analyst',
    avatar_emoji: '⚡',
    model: 'anthropic/claude-sonnet-4-6',
    gateway_agent_id: 'nikola'
  },
  {
    id: 'newton',
    name: 'Newton',
    role: 'developer',
    avatar_emoji: '🍎',
    model: 'anthropic/claude-haiku-4-5',
    gateway_agent_id: 'newton'
  },
  {
    id: 'scout',
    name: 'Scout',
    role: 'ops',
    avatar_emoji: '🐕',
    model: 'anthropic/claude-haiku-4-5',
    gateway_agent_id: 'scout'
  }
];

const DEFAULT_WORKFLOW = {
  id: 'default-workflow',
  name: 'Default Workflow',
  stages: [
    { status: 'inbox', label: 'Inbox', role: null },
    { status: 'in_progress', label: 'Building', role: 'developer' },
    { status: 'testing', label: 'Testing', role: 'analyst' },
    { status: 'review', label: 'Review', role: 'analyst' },
    { status: 'done', label: 'Done', role: null }
  ],
  fail_targets: {
    testing: 'in_progress',
    review: 'in_progress'
  }
};

export async function bootstrapCoreAgents(workspaceId: string): Promise<void> {
  // Upsert agents (idempotent)
  const agents = OUR_AGENTS.map(a => ({
    ...a,
    workspace_id: workspaceId,
    is_master: false,
    status: 'standby',
    source: 'local'
  }));

  const { error: agentError } = await supabase.from('agents').upsert(agents, { onConflict: 'id' });
  if (agentError) throw agentError;

  // Upsert default workflow template
  const workflow = {
    ...DEFAULT_WORKFLOW,
    id: `${DEFAULT_WORKFLOW.id}-${workspaceId}`,
    workspace_id: workspaceId,
    is_default: true
  };

  const { error: workflowError } = await supabase.from('workflow_templates').upsert(workflow, { onConflict: 'id' });
  if (workflowError) throw workflowError;
}

export async function cloneWorkflowTemplates(targetWorkspaceId: string): Promise<void> {
  const { data: templates } = await supabase.from('workflow_templates').select('*').eq('workspace_id', 'default');
  if (!templates || templates.length === 0) return;

  const toInsert = templates.map((t: any) => ({
    ...t,
    id: `${t.id}-${targetWorkspaceId}`,
    workspace_id: targetWorkspaceId
  }));

  await supabase.from('workflow_templates').insert(toInsert);
}
