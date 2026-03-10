import type { DbProvider } from './types';

let _provider: DbProvider | null = null;

/**
 * Get the configured database provider.
 * Loads the provider based on DATABASE_PROVIDER env var.
 * Default: sqlite
 */
export function getDb(): DbProvider {
  if (!_provider) {
    const mode = process.env.DATABASE_PROVIDER || 'sqlite';
    
    if (mode === 'supabase') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
      _provider = require('./supabase').default as DbProvider;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
      _provider = require('./sqlite/provider').default as DbProvider;
    }
  }
  return _provider as DbProvider;
}

/**
 * Proxy interface for database operations.
 * Routes all calls to the configured provider.
 */
export const db = new Proxy({} as DbProvider, {
  get(_, prop: string | symbol) {
    const provider = getDb();
    if (typeof prop === 'string') {
      return (provider as any)[prop];
    }
    return undefined;
  },
}) as DbProvider;

// ============================================================================
// Legacy Exports - For Routes Not Yet Migrated to Provider Pattern
// ============================================================================
// These exports maintain backward compatibility with existing routes
// that directly import from @/lib/db

export { supabase, supabaseAdmin } from './supabase/client';

// Type exports
export type { DbProvider } from './types';
export type {
  Agent,
  AgentInput,
  Task,
  TaskInput,
  TaskFilters,
  Event,
  EventInput,
  TaskActivity,
  TaskActivityInput,
  TaskDeliverable,
  TaskDeliverableInput,
  Checkpoint,
  CheckpointInput,
  Workspace,
  WorkspaceInput,
  Conversation,
  ConversationInput,
  Message,
  MessageInput,
  WorkflowTemplate,
  WorkflowTemplateInput,
  PlanningQuestion,
  PlanningQuestionInput,
  PlanningSpec,
  PlanningSpecInput,
  KnowledgeEntry,
  KnowledgeEntryInput,
  DispatchQueue,
  AgentHeartbeat,
} from './types';

// Dispatch operations (Phase 4, Supabase-only)
export * from './dispatch';
