import type { DbProvider, Agent, AgentInput, Task, TaskInput, TaskFilters, Event, EventInput, TaskActivity, TaskActivityInput, TaskDeliverable, TaskDeliverableInput, Checkpoint, CheckpointInput, Workspace, WorkspaceInput, Conversation, ConversationInput, Message, MessageInput, WorkflowTemplate, WorkflowTemplateInput, PlanningQuestion, PlanningQuestionInput, PlanningSpec, PlanningSpecInput, KnowledgeEntry, KnowledgeEntryInput } from '../types';
import { supabaseAdmin } from './client';
import { seedAgents } from './seed';

export const supabaseProvider: DbProvider = {
  // ======== Bootstrap ========
  async bootstrap(workspaceId: string): Promise<void> {
    await seedAgents(workspaceId);
  },

  // ======== Agents ========
  async getAgents(workspaceId: string): Promise<Agent[]> {
    const { data, error } = await supabaseAdmin
      .from('agents')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async getAgent(id: string): Promise<Agent | undefined> {
    const { data, error } = await supabaseAdmin
      .from('agents')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || undefined;
  },

  async createAgent(agent: AgentInput): Promise<Agent> {
    const { data, error } = await supabaseAdmin
      .from('agents')
      .insert([agent])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent> {
    const { data, error } = await supabaseAdmin
      .from('agents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteAgent(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('agents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getAgentsExcluding(workspaceId: string): Promise<Agent[]> {
    const { data, error } = await supabaseAdmin
      .from('agents')
      .select('*')
      .neq('workspace_id', workspaceId)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async upsertAgents(agents: Agent[]): Promise<Agent[]> {
    const { data, error } = await supabaseAdmin
      .from('agents')
      .upsert(agents, { onConflict: 'id' })
      .select();

    if (error) throw error;
    return data || [];
  },

  // ======== Tasks ========
  async getTasks(workspaceId: string, filters?: TaskFilters): Promise<Task[]> {
    let query = supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('workspace_id', workspaceId);

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.assigned_agent_id) query = query.eq('assigned_agent_id', filters.assigned_agent_id);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getTask(id: string): Promise<Task | undefined> {
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || undefined;
  },

  async createTask(task: TaskInput): Promise<Task> {
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .insert([task])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTask(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ======== Events ========
  async getEvents(workspaceId: string, limit: number = 50): Promise<Event[]> {
    const { data, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async getEvent(id: string): Promise<Event | undefined> {
    const { data, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || undefined;
  },

  async createEvent(event: EventInput): Promise<Event> {
    const { data, error } = await supabaseAdmin
      .from('events')
      .insert([event])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateEvent(id: string, updates: Partial<Event>): Promise<Event> {
    const { data, error } = await supabaseAdmin
      .from('events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteEvent(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('events')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ======== Task Activities ========
  async getActivities(taskId: string): Promise<TaskActivity[]> {
    const { data, error } = await supabaseAdmin
      .from('task_activities')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at');

    if (error) throw error;
    return data || [];
  },

  async getActivity(id: string): Promise<TaskActivity | undefined> {
    const { data, error } = await supabaseAdmin
      .from('task_activities')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || undefined;
  },

  async createActivity(activity: TaskActivityInput): Promise<TaskActivity> {
    const { data, error } = await supabaseAdmin
      .from('task_activities')
      .insert([activity])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateActivity(id: string, updates: Partial<TaskActivity>): Promise<TaskActivity> {
    const { data, error } = await supabaseAdmin
      .from('task_activities')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteActivity(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('task_activities')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ======== Task Deliverables ========
  async getDeliverables(taskId: string): Promise<TaskDeliverable[]> {
    const { data, error } = await supabaseAdmin
      .from('task_deliverables')
      .select('*')
      .eq('task_id', taskId);

    if (error) throw error;
    return data || [];
  },

  async getDeliverable(id: string): Promise<TaskDeliverable | undefined> {
    const { data, error } = await supabaseAdmin
      .from('task_deliverables')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || undefined;
  },

  async createDeliverable(deliverable: TaskDeliverableInput): Promise<TaskDeliverable> {
    const { data, error } = await supabaseAdmin
      .from('task_deliverables')
      .insert([deliverable])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateDeliverable(id: string, updates: Partial<TaskDeliverable>): Promise<TaskDeliverable> {
    const { data, error } = await supabaseAdmin
      .from('task_deliverables')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteDeliverable(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('task_deliverables')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ======== Checkpoints ========
  async getCheckpoints(workspaceId: string, status?: string): Promise<Checkpoint[]> {
    let query = supabaseAdmin
      .from('checkpoints')
      .select('*');

    if (status) query = query.eq('status', status);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getCheckpoint(agentId: string): Promise<Checkpoint | undefined> {
    const { data, error } = await supabaseAdmin
      .from('checkpoints')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || undefined;
  },

  async createCheckpoint(checkpoint: CheckpointInput): Promise<Checkpoint> {
    const { data, error } = await supabaseAdmin
      .from('checkpoints')
      .insert([checkpoint])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateCheckpoint(agentId: string, updates: Partial<Checkpoint>): Promise<Checkpoint> {
    const { data, error } = await supabaseAdmin
      .from('checkpoints')
      .update(updates)
      .eq('agent_id', agentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteCheckpoint(agentId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('checkpoints')
      .delete()
      .eq('agent_id', agentId);

    if (error) throw error;
  },

  async getCheckpointById(id: string): Promise<Checkpoint | undefined> {
    const { data, error } = await supabaseAdmin
      .from('checkpoints')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || undefined;
  },

  async updateCheckpointById(id: string, updates: Partial<Checkpoint>): Promise<Checkpoint> {
    const { data, error } = await supabaseAdmin
      .from('checkpoints')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteCheckpointById(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('checkpoints')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ======== Workspaces ========
  async getWorkspaces(): Promise<Workspace[]> {
    const { data, error } = await supabaseAdmin
      .from('workspaces')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async getWorkspace(id: string): Promise<Workspace | undefined> {
    const { data, error } = await supabaseAdmin
      .from('workspaces')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || undefined;
  },

  async createWorkspace(workspace: WorkspaceInput): Promise<Workspace> {
    const { data, error } = await supabaseAdmin
      .from('workspaces')
      .insert([workspace])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateWorkspace(id: string, updates: Partial<Workspace>): Promise<Workspace> {
    const { data, error } = await supabaseAdmin
      .from('workspaces')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteWorkspace(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('workspaces')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ======== Conversations ========
  async getConversations(workspaceId: string): Promise<Conversation[]> {
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getConversation(id: string): Promise<Conversation | undefined> {
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || undefined;
  },

  async createConversation(conversation: ConversationInput): Promise<Conversation> {
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .insert([conversation])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation> {
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteConversation(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('conversations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ======== Messages ========
  async getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at');

    if (error) throw error;
    return data || [];
  },

  async getMessage(id: string): Promise<Message | undefined> {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || undefined;
  },

  async createMessage(message: MessageInput): Promise<Message> {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert([message])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteMessage(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('messages')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ======== Workflow Templates ========
  async getWorkflowTemplates(workspaceId: string): Promise<WorkflowTemplate[]> {
    const { data, error } = await supabaseAdmin
      .from('workflow_templates')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async getWorkflowTemplate(id: string): Promise<WorkflowTemplate | undefined> {
    const { data, error } = await supabaseAdmin
      .from('workflow_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || undefined;
  },

  async createWorkflowTemplate(template: WorkflowTemplateInput): Promise<WorkflowTemplate> {
    const { data, error } = await supabaseAdmin
      .from('workflow_templates')
      .insert([template])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateWorkflowTemplate(id: string, updates: Partial<WorkflowTemplate>): Promise<WorkflowTemplate> {
    const { data, error } = await supabaseAdmin
      .from('workflow_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteWorkflowTemplate(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('workflow_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async upsertWorkflowTemplate(template: WorkflowTemplate): Promise<WorkflowTemplate> {
    const { data, error } = await supabaseAdmin
      .from('workflow_templates')
      .upsert([template], { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ======== Planning Questions ========
  async getPlanningQuestions(): Promise<PlanningQuestion[]> {
    const { data, error } = await supabaseAdmin
      .from('planning_questions')
      .select('*')
      .order('created_at');

    if (error) throw error;
    return data || [];
  },

  async getPlanningQuestion(id: string): Promise<PlanningQuestion | undefined> {
    const { data, error } = await supabaseAdmin
      .from('planning_questions')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || undefined;
  },

  async createPlanningQuestion(question: PlanningQuestionInput): Promise<PlanningQuestion> {
    const { data, error } = await supabaseAdmin
      .from('planning_questions')
      .insert([question])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePlanningQuestion(id: string, updates: Partial<PlanningQuestion>): Promise<PlanningQuestion> {
    const { data, error } = await supabaseAdmin
      .from('planning_questions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deletePlanningQuestion(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('planning_questions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getPlanningQuestionsByTask(taskId: string): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('planning_questions')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // ======== Planning Specs ========
  async getPlanningSpecs(): Promise<PlanningSpec[]> {
    const { data, error } = await supabaseAdmin
      .from('planning_specs')
      .select('*')
      .order('created_at');

    if (error) throw error;
    return data || [];
  },

  async getPlanningSpec(id: string): Promise<PlanningSpec | undefined> {
    const { data, error } = await supabaseAdmin
      .from('planning_specs')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || undefined;
  },

  async createPlanningSpec(spec: PlanningSpecInput): Promise<PlanningSpec> {
    const { data, error } = await supabaseAdmin
      .from('planning_specs')
      .insert([spec])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePlanningSpec(id: string, updates: Partial<PlanningSpec>): Promise<PlanningSpec> {
    const { data, error } = await supabaseAdmin
      .from('planning_specs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deletePlanningSpec(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('planning_specs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getPlanningSpecsByTask(taskId: string): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('planning_specs')
      .select('*')
      .eq('task_id', taskId);

    if (error) throw error;
    return data || [];
  },

  // ======== Knowledge Entries ========
  async getKnowledgeEntries(): Promise<KnowledgeEntry[]> {
    const { data, error } = await supabaseAdmin
      .from('knowledge_entries')
      .select('*')
      .order('created_at');

    if (error) throw error;
    return data || [];
  },

  async getKnowledgeEntry(id: string): Promise<KnowledgeEntry | undefined> {
    const { data, error } = await supabaseAdmin
      .from('knowledge_entries')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || undefined;
  },

  async createKnowledgeEntry(entry: KnowledgeEntryInput): Promise<KnowledgeEntry> {
    const { data, error } = await supabaseAdmin
      .from('knowledge_entries')
      .insert([entry])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateKnowledgeEntry(id: string, updates: Partial<KnowledgeEntry>): Promise<KnowledgeEntry> {
    const { data, error } = await supabaseAdmin
      .from('knowledge_entries')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteKnowledgeEntry(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('knowledge_entries')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ======== OpenClaw Sessions ========
  async getOpenClawSession(id: string): Promise<Record<string, any> | undefined> {
    const { data, error } = await supabaseAdmin
      .from('openclaw_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || undefined;
  },

  async createOpenClawSession(session: Record<string, any>): Promise<Record<string, any>> {
    const { data, error } = await supabaseAdmin
      .from('openclaw_sessions')
      .insert([session])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateOpenClawSession(id: string, updates: Record<string, any>): Promise<Record<string, any>> {
    const { data, error } = await supabaseAdmin
      .from('openclaw_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteOpenClawSession(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('openclaw_sessions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ======== Task Roles ========
  async getTaskRoles(taskId: string): Promise<Record<string, any>[]> {
    const { data, error } = await supabaseAdmin
      .from('task_roles')
      .select('*')
      .eq('task_id', taskId);

    if (error) throw error;
    return data || [];
  },

  async getTaskRole(id: string): Promise<Record<string, any> | undefined> {
    const { data, error } = await supabaseAdmin
      .from('task_roles')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || undefined;
  },

  async createTaskRole(role: Record<string, any>): Promise<Record<string, any>> {
    const { data, error } = await supabaseAdmin
      .from('task_roles')
      .insert([role])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTaskRole(id: string, updates: Record<string, any>): Promise<Record<string, any>> {
    const { data, error } = await supabaseAdmin
      .from('task_roles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTaskRole(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('task_roles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

export default supabaseProvider;
