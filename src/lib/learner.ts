import { supabase } from '@/lib/db';
import type { KnowledgeEntry } from '@/lib/types';

export async function notifyLearner(_taskId: string, _event: any): Promise<void> {
  // Learner notification (best-effort, not implemented in migration)
}

export async function getRelevantKnowledge(workspaceId: string, _taskTitle: string, limit = 5): Promise<KnowledgeEntry[]> {
  const { data } = await supabase.from('knowledge_entries').select('*').eq('workspace_id', workspaceId).limit(limit);
  return data || [];
}

export function formatKnowledgeForDispatch(entries: KnowledgeEntry[]): string {
  if (entries.length === 0) return '';
  const items = entries.map((e, i) => `${i + 1}. **${e.title}** (${e.category})`).join('\n\n');
  return `\n---\n📚 **LESSONS:**\n${items}\n`;
}
