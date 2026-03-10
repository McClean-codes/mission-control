import { bootstrapCoreAgents } from '@/lib/bootstrap-agents';

export async function seedAgents(workspaceId: string): Promise<void> {
  await bootstrapCoreAgents(workspaceId);
}
