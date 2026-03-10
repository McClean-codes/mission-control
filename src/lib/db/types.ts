// ============================================================================
// DbProvider Interface - Abstraction for SQLite and Supabase
// ============================================================================

export interface DbProvider {
  // Bootstrap
  bootstrap(workspaceId: string): Promise<void>;

  // Agents
  getAgents(workspaceId: string): Promise<Agent[]>;
  getAgent(id: string): Promise<Agent | undefined>;
  getAgentsExcluding(workspaceId: string): Promise<Agent[]>;
  createAgent(agent: AgentInput): Promise<Agent>;
  updateAgent(id: string, updates: Partial<Agent>): Promise<Agent>;
  upsertAgents(agents: Agent[]): Promise<Agent[]>;
  deleteAgent(id: string): Promise<void>;

  // Tasks
  getTasks(workspaceId: string, filters?: TaskFilters): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: TaskInput): Promise<Task>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task>;
  deleteTask(id: string): Promise<void>;

  // Events
  getEvents(workspaceId: string, limit?: number): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  createEvent(event: EventInput): Promise<Event>;
  updateEvent(id: string, updates: Partial<Event>): Promise<Event>;
  deleteEvent(id: string): Promise<void>;

  // Task Activities
  getActivities(taskId: string): Promise<TaskActivity[]>;
  getActivity(id: string): Promise<TaskActivity | undefined>;
  createActivity(activity: TaskActivityInput): Promise<TaskActivity>;
  updateActivity(id: string, updates: Partial<TaskActivity>): Promise<TaskActivity>;
  deleteActivity(id: string): Promise<void>;

  // Task Deliverables
  getDeliverables(taskId: string): Promise<TaskDeliverable[]>;
  getDeliverable(id: string): Promise<TaskDeliverable | undefined>;
  createDeliverable(deliverable: TaskDeliverableInput): Promise<TaskDeliverable>;
  updateDeliverable(id: string, updates: Partial<TaskDeliverable>): Promise<TaskDeliverable>;
  deleteDeliverable(id: string): Promise<void>;

  // Checkpoints
  getCheckpoints(workspaceId: string, status?: string): Promise<Checkpoint[]>;
  getCheckpoint(agentId: string): Promise<Checkpoint | undefined>;
  getCheckpointById(id: string): Promise<Checkpoint | undefined>;
  createCheckpoint(checkpoint: CheckpointInput): Promise<Checkpoint>;
  updateCheckpoint(agentId: string, updates: Partial<Checkpoint>): Promise<Checkpoint>;
  updateCheckpointById(id: string, updates: Partial<Checkpoint>): Promise<Checkpoint>;
  deleteCheckpoint(agentId: string): Promise<void>;
  deleteCheckpointById(id: string): Promise<void>;

  // Workspaces
  getWorkspaces(): Promise<Workspace[]>;
  getWorkspace(id: string): Promise<Workspace | undefined>;
  createWorkspace(workspace: WorkspaceInput): Promise<Workspace>;
  updateWorkspace(id: string, updates: Partial<Workspace>): Promise<Workspace>;
  deleteWorkspace(id: string): Promise<void>;

  // Conversations
  getConversations(workspaceId: string): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation | undefined>;
  createConversation(conversation: ConversationInput): Promise<Conversation>;
  updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation>;
  deleteConversation(id: string): Promise<void>;

  // Messages
  getMessages(conversationId: string): Promise<Message[]>;
  getMessage(id: string): Promise<Message | undefined>;
  createMessage(message: MessageInput): Promise<Message>;
  deleteMessage(id: string): Promise<void>;

  // Workflow Templates
  getWorkflowTemplates(workspaceId: string): Promise<WorkflowTemplate[]>;
  getWorkflowTemplate(id: string): Promise<WorkflowTemplate | undefined>;
  createWorkflowTemplate(template: WorkflowTemplateInput): Promise<WorkflowTemplate>;
  updateWorkflowTemplate(id: string, updates: Partial<WorkflowTemplate>): Promise<WorkflowTemplate>;
  upsertWorkflowTemplate(template: WorkflowTemplate): Promise<WorkflowTemplate>;
  deleteWorkflowTemplate(id: string): Promise<void>;

  // Planning Questions
  getPlanningQuestions(): Promise<PlanningQuestion[]>;
  getPlanningQuestionsByTask(taskId: string): Promise<any[]>;
  getPlanningQuestion(id: string): Promise<PlanningQuestion | undefined>;
  createPlanningQuestion(question: PlanningQuestionInput): Promise<PlanningQuestion>;
  updatePlanningQuestion(id: string, updates: Partial<PlanningQuestion>): Promise<PlanningQuestion>;
  deletePlanningQuestion(id: string): Promise<void>;

  // Planning Specs
  getPlanningSpecs(): Promise<PlanningSpec[]>;
  getPlanningSpecsByTask(taskId: string): Promise<any[]>;
  getPlanningSpec(id: string): Promise<PlanningSpec | undefined>;
  createPlanningSpec(spec: PlanningSpecInput): Promise<PlanningSpec>;
  updatePlanningSpec(id: string, updates: Partial<PlanningSpec>): Promise<PlanningSpec>;
  deletePlanningSpec(id: string): Promise<void>;

  // Knowledge Entries
  getKnowledgeEntries(): Promise<KnowledgeEntry[]>;
  getKnowledgeEntry(id: string): Promise<KnowledgeEntry | undefined>;
  createKnowledgeEntry(entry: KnowledgeEntryInput): Promise<KnowledgeEntry>;
  updateKnowledgeEntry(id: string, updates: Partial<KnowledgeEntry>): Promise<KnowledgeEntry>;
  deleteKnowledgeEntry(id: string): Promise<void>;

  // OpenClaw Sessions (for subagent spawning & management)
  getOpenClawSession(id: string): Promise<Record<string, any> | undefined>;
  createOpenClawSession(session: Record<string, any>): Promise<Record<string, any>>;
  updateOpenClawSession(id: string, updates: Record<string, any>): Promise<Record<string, any>>;
  deleteOpenClawSession(id: string): Promise<void>;

  // Task Roles (for task role assignment)
  getTaskRoles(taskId: string): Promise<Record<string, any>[]>;
  getTaskRole(id: string): Promise<Record<string, any> | undefined>;
  createTaskRole(role: Record<string, any>): Promise<Record<string, any>>;
  updateTaskRole(id: string, updates: Record<string, any>): Promise<Record<string, any>>;
  deleteTaskRole(id: string): Promise<void>;
}

// ============================================================================
// Entity Types
// ============================================================================

export interface Agent {
  id: string;
  name: string;
  role: string;
  description?: string;
  avatar_emoji: string;
  status: 'standby' | 'working' | 'offline';
  is_master: boolean;
  workspace_id: string;
  soul_md?: string;
  user_md?: string;
  agents_md?: string;
  model?: string;
  source: string;
  gateway_agent_id?: string;
  session_key_prefix?: string;
  created_at: string;
  updated_at: string;
}

export type AgentInput = Omit<Agent, 'created_at' | 'updated_at'>;

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assigned_agent_id?: string;
  created_by_agent_id?: string;
  workspace_id: string;
  business_id: string;
  due_date?: string;
  workflow_template_id?: string;
  planning_session_key?: string;
  planning_messages?: Record<string, any>;
  planning_complete: boolean;
  planning_spec?: string;
  planning_agents?: Record<string, any>;
  planning_dispatch_error?: string;
  status_reason?: string;
  created_at: string;
  updated_at: string;
}

export type TaskInput = Omit<Task, 'created_at' | 'updated_at'>;

export interface TaskFilters {
  status?: string;
  assigned_agent_id?: string;
}

export interface Event {
  id: string;
  type: string;
  agent_id?: string;
  task_id?: string;
  message: string;
  metadata?: Record<string, any>;
  workspace_id: string;
  created_at: string;
}

export type EventInput = Omit<Event, 'id' | 'created_at'>;

export interface TaskActivity {
  id: string;
  task_id: string;
  agent_id?: string;
  action: string;
  description?: string;
  details?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type TaskActivityInput = Omit<TaskActivity, 'id' | 'created_at' | 'updated_at'>;

export interface TaskDeliverable {
  id: string;
  task_id: string;
  name: string;
  description?: string;
  url?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  created_at: string;
  updated_at: string;
}

export type TaskDeliverableInput = Omit<TaskDeliverable, 'id' | 'created_at' | 'updated_at'>;

export interface Checkpoint {
  agent_id: string;
  status: string;
  summary?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type CheckpointInput = Omit<Checkpoint, 'created_at' | 'updated_at'>;

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export type WorkspaceInput = Omit<Workspace, 'created_at' | 'updated_at'>;

export interface Conversation {
  id: string;
  title: string;
  workspace_id: string;
  agent_id?: string;
  created_at: string;
  updated_at: string;
}

export type ConversationInput = Omit<Conversation, 'created_at' | 'updated_at'>;

export interface Message {
  id: string;
  conversation_id: string;
  agent_id?: string;
  content: string;
  created_at: string;
}

export type MessageInput = Omit<Message, 'created_at'>;

export interface WorkflowTemplate {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  stages?: Record<string, any>;
  fail_targets?: Record<string, any>;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export type WorkflowTemplateInput = Omit<WorkflowTemplate, 'created_at' | 'updated_at'>;

export interface PlanningQuestion {
  id: string;
  question: string;
  context?: string;
  category?: string;
  created_at: string;
}

export type PlanningQuestionInput = Omit<PlanningQuestion, 'created_at'>;

export interface PlanningSpec {
  id: string;
  spec_text: string;
  source?: string;
  created_at: string;
}

export type PlanningSpecInput = Omit<PlanningSpec, 'created_at'>;

export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export type KnowledgeEntryInput = Omit<KnowledgeEntry, 'created_at' | 'updated_at'>;

// Phase 4: Dispatch & Heartbeats (Supabase-only for now)
export interface DispatchQueue {
  id: string;
  task_id: string;
  agent_id: string;
  workspace_id: string;
  action: string;
  payload?: Record<string, any>;
  status: 'pending' | 'claimed' | 'running' | 'completed' | 'failed' | 'cancelled';
  result?: Record<string, any>;
  error?: string;
  claimed_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AgentHeartbeat {
  agent_id: string;
  last_seen_at: string;
  gateway_version?: string;
  metadata?: Record<string, any>;
}
