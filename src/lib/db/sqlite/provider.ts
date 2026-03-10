import type { DbProvider, Agent, AgentInput, Task, TaskInput, TaskFilters, Event, EventInput, TaskActivity, TaskActivityInput, TaskDeliverable, TaskDeliverableInput, Checkpoint, CheckpointInput, Workspace, WorkspaceInput, Conversation, ConversationInput, Message, MessageInput, WorkflowTemplate, WorkflowTemplateInput, PlanningQuestion, PlanningQuestionInput, PlanningSpec, PlanningSpecInput, KnowledgeEntry, KnowledgeEntryInput } from '../types';
import { queryAll, queryOne, run } from './index';

export const sqliteProvider: DbProvider = {
  // Bootstrap - seed initial data
  async bootstrap(workspaceId: string): Promise<void> {
    throw new Error('SQLite bootstrap not implemented — migration pending');
  },

  // ======== Agents ========
  async getAgents(workspaceId: string): Promise<Agent[]> {
    return queryAll<Agent>(
      'SELECT * FROM agents WHERE workspace_id = ? ORDER BY name',
      [workspaceId]
    );
  },

  async getAgent(id: string): Promise<Agent | undefined> {
    return queryOne<Agent>('SELECT * FROM agents WHERE id = ?', [id]);
  },

  async createAgent(agent: AgentInput): Promise<Agent> {
    throw new Error('SQLite createAgent not implemented — migration pending');
  },

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent> {
    throw new Error('SQLite updateAgent not implemented — migration pending');
  },

  async deleteAgent(id: string): Promise<void> {
    throw new Error('SQLite deleteAgent not implemented — migration pending');
  },

  async getAgentsExcluding(workspaceId: string): Promise<Agent[]> {
    throw new Error('SQLite getAgentsExcluding not implemented — migration pending');
  },

  async upsertAgents(agents: Agent[]): Promise<Agent[]> {
    throw new Error('SQLite upsertAgents not implemented — migration pending');
  },

  // ======== Tasks ========
  async getTasks(workspaceId: string, filters?: TaskFilters): Promise<Task[]> {
    throw new Error('SQLite getTasks not implemented — migration pending');
  },

  async getTask(id: string): Promise<Task | undefined> {
    throw new Error('SQLite getTask not implemented — migration pending');
  },

  async createTask(task: TaskInput): Promise<Task> {
    throw new Error('SQLite createTask not implemented — migration pending');
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    throw new Error('SQLite updateTask not implemented — migration pending');
  },

  async deleteTask(id: string): Promise<void> {
    throw new Error('SQLite deleteTask not implemented — migration pending');
  },

  // ======== Events ========
  async getEvents(workspaceId: string, limit?: number): Promise<Event[]> {
    throw new Error('SQLite getEvents not implemented — migration pending');
  },

  async getEvent(id: string): Promise<Event | undefined> {
    throw new Error('SQLite getEvent not implemented — migration pending');
  },

  async createEvent(event: EventInput): Promise<Event> {
    throw new Error('SQLite createEvent not implemented — migration pending');
  },

  async updateEvent(id: string, updates: Partial<Event>): Promise<Event> {
    throw new Error('SQLite updateEvent not implemented — migration pending');
  },

  async deleteEvent(id: string): Promise<void> {
    throw new Error('SQLite deleteEvent not implemented — migration pending');
  },

  // ======== Task Activities ========
  async getActivities(taskId: string): Promise<TaskActivity[]> {
    throw new Error('SQLite getActivities not implemented — migration pending');
  },

  async getActivity(id: string): Promise<TaskActivity | undefined> {
    throw new Error('SQLite getActivity not implemented — migration pending');
  },

  async createActivity(activity: TaskActivityInput): Promise<TaskActivity> {
    throw new Error('SQLite createActivity not implemented — migration pending');
  },

  async updateActivity(id: string, updates: Partial<TaskActivity>): Promise<TaskActivity> {
    throw new Error('SQLite updateActivity not implemented — migration pending');
  },

  async deleteActivity(id: string): Promise<void> {
    throw new Error('SQLite deleteActivity not implemented — migration pending');
  },

  // ======== Task Deliverables ========
  async getDeliverables(taskId: string): Promise<TaskDeliverable[]> {
    throw new Error('SQLite getDeliverables not implemented — migration pending');
  },

  async getDeliverable(id: string): Promise<TaskDeliverable | undefined> {
    throw new Error('SQLite getDeliverable not implemented — migration pending');
  },

  async createDeliverable(deliverable: TaskDeliverableInput): Promise<TaskDeliverable> {
    throw new Error('SQLite createDeliverable not implemented — migration pending');
  },

  async updateDeliverable(id: string, updates: Partial<TaskDeliverable>): Promise<TaskDeliverable> {
    throw new Error('SQLite updateDeliverable not implemented — migration pending');
  },

  async deleteDeliverable(id: string): Promise<void> {
    throw new Error('SQLite deleteDeliverable not implemented — migration pending');
  },

  // ======== Checkpoints ========
  async getCheckpoints(workspaceId: string, status?: string): Promise<Checkpoint[]> {
    return []; // SQLite doesn't have checkpoints — return empty
  },

  async getCheckpoint(agentId: string): Promise<Checkpoint | undefined> {
    return undefined;
  },

  async createCheckpoint(checkpoint: CheckpointInput): Promise<Checkpoint> {
    throw new Error('Checkpoints not supported in SQLite mode');
  },

  async updateCheckpoint(agentId: string, updates: Partial<Checkpoint>): Promise<Checkpoint> {
    throw new Error('Checkpoints not supported in SQLite mode');
  },

  async deleteCheckpoint(agentId: string): Promise<void> {
    throw new Error('Checkpoints not supported in SQLite mode');
  },

  // ======== Workspaces ========
  async getWorkspaces(): Promise<Workspace[]> {
    throw new Error('SQLite getWorkspaces not implemented — migration pending');
  },

  async getWorkspace(id: string): Promise<Workspace | undefined> {
    throw new Error('SQLite getWorkspace not implemented — migration pending');
  },

  async createWorkspace(workspace: WorkspaceInput): Promise<Workspace> {
    throw new Error('SQLite createWorkspace not implemented — migration pending');
  },

  async updateWorkspace(id: string, updates: Partial<Workspace>): Promise<Workspace> {
    throw new Error('SQLite updateWorkspace not implemented — migration pending');
  },

  async deleteWorkspace(id: string): Promise<void> {
    throw new Error('SQLite deleteWorkspace not implemented — migration pending');
  },

  // ======== Conversations ========
  async getConversations(workspaceId: string): Promise<Conversation[]> {
    throw new Error('SQLite getConversations not implemented — migration pending');
  },

  async getConversation(id: string): Promise<Conversation | undefined> {
    throw new Error('SQLite getConversation not implemented — migration pending');
  },

  async createConversation(conversation: ConversationInput): Promise<Conversation> {
    throw new Error('SQLite createConversation not implemented — migration pending');
  },

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation> {
    throw new Error('SQLite updateConversation not implemented — migration pending');
  },

  async deleteConversation(id: string): Promise<void> {
    throw new Error('SQLite deleteConversation not implemented — migration pending');
  },

  // ======== Messages ========
  async getMessages(conversationId: string): Promise<Message[]> {
    throw new Error('SQLite getMessages not implemented — migration pending');
  },

  async getMessage(id: string): Promise<Message | undefined> {
    throw new Error('SQLite getMessage not implemented — migration pending');
  },

  async createMessage(message: MessageInput): Promise<Message> {
    throw new Error('SQLite createMessage not implemented — migration pending');
  },

  async deleteMessage(id: string): Promise<void> {
    throw new Error('SQLite deleteMessage not implemented — migration pending');
  },

  // ======== Workflow Templates ========
  async getWorkflowTemplates(workspaceId: string): Promise<WorkflowTemplate[]> {
    throw new Error('SQLite getWorkflowTemplates not implemented — migration pending');
  },

  async getWorkflowTemplate(id: string): Promise<WorkflowTemplate | undefined> {
    throw new Error('SQLite getWorkflowTemplate not implemented — migration pending');
  },

  async createWorkflowTemplate(template: WorkflowTemplateInput): Promise<WorkflowTemplate> {
    throw new Error('SQLite createWorkflowTemplate not implemented — migration pending');
  },

  async updateWorkflowTemplate(id: string, updates: Partial<WorkflowTemplate>): Promise<WorkflowTemplate> {
    throw new Error('SQLite updateWorkflowTemplate not implemented — migration pending');
  },

  async deleteWorkflowTemplate(id: string): Promise<void> {
    throw new Error('SQLite deleteWorkflowTemplate not implemented — migration pending');
  },

  // ======== Planning Questions ========
  async getPlanningQuestions(): Promise<PlanningQuestion[]> {
    throw new Error('SQLite getPlanningQuestions not implemented — migration pending');
  },

  async getPlanningQuestion(id: string): Promise<PlanningQuestion | undefined> {
    throw new Error('SQLite getPlanningQuestion not implemented — migration pending');
  },

  async createPlanningQuestion(question: PlanningQuestionInput): Promise<PlanningQuestion> {
    throw new Error('SQLite createPlanningQuestion not implemented — migration pending');
  },

  async updatePlanningQuestion(id: string, updates: Partial<PlanningQuestion>): Promise<PlanningQuestion> {
    throw new Error('SQLite updatePlanningQuestion not implemented — migration pending');
  },

  async deletePlanningQuestion(id: string): Promise<void> {
    throw new Error('SQLite deletePlanningQuestion not implemented — migration pending');
  },

  // ======== Planning Specs ========
  async getPlanningSpecs(): Promise<PlanningSpec[]> {
    throw new Error('SQLite getPlanningSpecs not implemented — migration pending');
  },

  async getPlanningSpec(id: string): Promise<PlanningSpec | undefined> {
    throw new Error('SQLite getPlanningSpec not implemented — migration pending');
  },

  async createPlanningSpec(spec: PlanningSpecInput): Promise<PlanningSpec> {
    throw new Error('SQLite createPlanningSpec not implemented — migration pending');
  },

  async updatePlanningSpec(id: string, updates: Partial<PlanningSpec>): Promise<PlanningSpec> {
    throw new Error('SQLite updatePlanningSpec not implemented — migration pending');
  },

  async deletePlanningSpec(id: string): Promise<void> {
    throw new Error('SQLite deletePlanningSpec not implemented — migration pending');
  },

  // ======== Knowledge Entries ========
  async getKnowledgeEntries(): Promise<KnowledgeEntry[]> {
    throw new Error('SQLite getKnowledgeEntries not implemented — migration pending');
  },

  async getKnowledgeEntry(id: string): Promise<KnowledgeEntry | undefined> {
    throw new Error('SQLite getKnowledgeEntry not implemented — migration pending');
  },

  async createKnowledgeEntry(entry: KnowledgeEntryInput): Promise<KnowledgeEntry> {
    throw new Error('SQLite createKnowledgeEntry not implemented — migration pending');
  },

  async updateKnowledgeEntry(id: string, updates: Partial<KnowledgeEntry>): Promise<KnowledgeEntry> {
    throw new Error('SQLite updateKnowledgeEntry not implemented — migration pending');
  },

  async deleteKnowledgeEntry(id: string): Promise<void> {
    throw new Error('SQLite deleteKnowledgeEntry not implemented — migration pending');
  },

  // ======== OpenClaw Sessions ========
  async getOpenClawSession(id: string): Promise<Record<string, any> | undefined> {
    throw new Error('SQLite getOpenClawSession not implemented — migration pending');
  },

  async createOpenClawSession(session: Record<string, any>): Promise<Record<string, any>> {
    throw new Error('SQLite createOpenClawSession not implemented — migration pending');
  },

  async updateOpenClawSession(id: string, updates: Record<string, any>): Promise<Record<string, any>> {
    throw new Error('SQLite updateOpenClawSession not implemented — migration pending');
  },

  async deleteOpenClawSession(id: string): Promise<void> {
    throw new Error('SQLite deleteOpenClawSession not implemented — migration pending');
  },

  // ======== Task Roles ========
  async getTaskRoles(taskId: string): Promise<Record<string, any>[]> {
    throw new Error('SQLite getTaskRoles not implemented — migration pending');
  },

  async getTaskRole(id: string): Promise<Record<string, any> | undefined> {
    throw new Error('SQLite getTaskRole not implemented — migration pending');
  },

  async createTaskRole(role: Record<string, any>): Promise<Record<string, any>> {
    throw new Error('SQLite createTaskRole not implemented — migration pending');
  },

  async updateTaskRole(id: string, updates: Record<string, any>): Promise<Record<string, any>> {
    throw new Error('SQLite updateTaskRole not implemented — migration pending');
  },

  async deleteTaskRole(id: string): Promise<void> {
    throw new Error('SQLite deleteTaskRole not implemented — migration pending');
  },
};

export default sqliteProvider;
