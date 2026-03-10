import { db } from '@/lib/db';
import type { KnowledgeEntry } from '@/lib/db/types';

export async function notifyLearner(_taskId: string, _event: any): Promise<void> {
  // Learner notification (best-effort, not implemented in migration)
}

export async function getRelevantKnowledge(_workspaceId: string, _taskTitle: string, limit = 5): Promise<KnowledgeEntry[]> {
  const entries = await db.getKnowledgeEntries();
  return (entries || []).slice(0, limit);
}

export function formatKnowledgeForDispatch(entries: KnowledgeEntry[]): string {
  if (entries.length === 0) return '';
  const items = entries.map((e, i) => `${i + 1}. **${e.title}**${e.tags ? ` (${e.tags.join(', ')})` : ''}`).join('\n\n');
  return `\n---\n📚 **LESSONS:**\n${items}\n`;
}
