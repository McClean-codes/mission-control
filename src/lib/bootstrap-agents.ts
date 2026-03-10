import { supabase } from '@/lib/db';
import { getMissionControlUrl } from '@/lib/config';

const AGENT_DEFS = [
  { name: 'Builder Agent', role: 'builder', emoji: '🛠️' },
  { name: 'Tester Agent', role: 'tester', emoji: '🧪' },
  { name: 'Reviewer Agent', role: 'reviewer', emoji: '🔍' },
  { name: 'Learner Agent', role: 'learner', emoji: '📚' }
];

export async function bootstrapCoreAgents(workspaceId: string): Promise<void> {
  const { count } = await supabase.from('agents').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId);
  if ((count || 0) > 0) return;

  const agents = AGENT_DEFS.map(a => ({
    id: crypto.randomUUID(),
    name: a.name,
    role: a.role,
    avatar_emoji: a.emoji,
    workspace_id: workspaceId,
    is_master: false,
    status: 'standby',
    source: 'local'
  }));

  await supabase.from('agents').insert(agents);
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
