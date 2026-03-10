# API Route Migration Checklist

## Overview
All 43 API routes inventoried below. Each route's DB calls are mapped to `DbProvider` methods in `src/lib/db/types.ts`. Routes that exclusively call OpenClaw Gateway HTTP API (not Supabase) are marked `DB: none` and do not require provider migration.

Routes that are Phase 4 extensions (dispatch, heartbeats) are marked as `dispatch layer` — they use `src/lib/db/dispatch/` directly and stay Supabase-only.

---

## Agent Routes

### GET /api/agents
- **GET:** List all agents, optionally filter by workspace
- `supabase.from('agents').select('*')` → `db.getAgents(workspaceId)` ✅
- `supabase.from('agents').select('*').neq('workspace_id', ...)` → **NEEDS NEW METHOD** `db.getAgentsOutsideWorkspace()` or similar
  - Gap: DbProvider has `getAgents()` but doesn't support `neq` filter
  - Mitigation: Add `getAgentsExcluding(workspaceId: string): Promise<Agent[]>`

### POST /api/agents
- **POST:** Create a new agent
- `supabase.from('agents').insert({...})` → `db.createAgent(agent)` ✅

### GET /api/agents/[id]
- **GET:** Fetch single agent by ID
- `supabase.from('agents').select('*').eq('id', id).single()` → `db.getAgent(id)` ✅

### PATCH /api/agents/[id]
- **PATCH:** Update an agent
- `supabase.from('agents').update(data).eq('id', id)` → `db.updateAgent(id, data)` ✅

### DELETE /api/agents/[id]
- **DELETE:** Delete an agent
- `supabase.from('agents').delete().eq('id', id)` → `db.deleteAgent(id)` ✅

### GET /api/agents/discover
- **GET:** List agents outside current workspace
- `supabase.from('agents').select('*').neq('workspace_id', workspaceId)` → `db.getAgentsExcluding(workspaceId)` (NEW)

### POST /api/agents/import
- **POST:** Bulk import agents from external source
- `supabase.from('agents').select('*')` → `db.getAgents(workspaceId)` ✅
- `supabase.from('agents').upsert([...])` → **NEEDS NEW METHOD** `db.upsertAgents(agents: Agent[])`
  - Gap: DbProvider has no `upsert` method

### GET /api/agents/[id]/openclaw
- **GET/POST/DELETE:** OpenClaw session operations
- `supabase.from('openclaw_sessions')` calls (select/insert/delete/update) → `db.get/createOpenClawSession()` ✅ MIGRATED ✅

---

## Checkpoint Routes

### GET /api/checkpoints
- **GET:** List all checkpoints
- `supabase.from('checkpoints').select('*')` → `db.getCheckpoints(workspaceId)` ✅ MIGRATED ✅

### POST /api/checkpoints
- **POST:** Create checkpoint
- `supabase.from('checkpoints').insert({...})` → `db.createCheckpoint(checkpoint)` ✅ MIGRATED ✅

### GET /api/checkpoints/[id]
- **GET:** Fetch single checkpoint
- `supabase.from('checkpoints').select('*').eq('id', id).single()` → `db.getCheckpointById(id)` ✅ MIGRATED ✅

### PATCH /api/checkpoints/[id]
- **PATCH:** Update checkpoint
- `supabase.from('checkpoints').update(...).eq('id', id)` → `db.updateCheckpointById(id, updates)` ✅ MIGRATED ✅

### DELETE /api/checkpoints/[id]
- **DELETE:** Delete checkpoint
- `supabase.from('checkpoints').delete().eq('id', id)` → `db.deleteCheckpointById(id)` ✅ MIGRATED ✅

---

## Dispatch & Heartbeats (Phase 4 Extension)

### POST /api/dispatch
- **DB:** dispatch layer — Supabase-only, uses `src/lib/db/dispatch/` directly, NOT migrating to DbProvider ⚠️

### GET /api/heartbeats
- **DB:** dispatch layer — Supabase-only, uses `src/lib/db/dispatch/` directly, NOT migrating to DbProvider ⚠️

---

## Event Routes

### GET /api/events
- **GET:** List all events
- `supabase.from('events').select('*')` → `db.getEvents(workspaceId)` ✅ MIGRATED ✅

### POST /api/events
- **POST:** Create event
- `supabase.from('events').insert({...})` → `db.createEvent(event)` ✅ MIGRATED ✅

### PATCH /api/events
- **PATCH:** Update event
- `supabase.from('events').update(...).eq('id', id)` → `db.updateEvent(id, data)` ✅ MIGRATED ✅

### DELETE /api/events/[id]
- **DELETE:** Delete event
- `supabase.from('events').delete().eq('id', id)` → `db.deleteEvent(id)` ✅ MIGRATED ✅

### GET /api/events/stream
- **DB:** none — Server-Sent Events stream endpoint, does not make direct DB calls

---

## File Routes

### GET /api/files/download
### GET /api/files/preview
### GET /api/files/reveal
### POST /api/files/upload
- **DB:** none — File operations (not table-based), do not make DB calls

---

## Health Route

### GET /api/health
- **GET:** Health check endpoint
- `supabase.from('workspaces').select('id').limit(1)` → `db.getWorkspaces()` ✅ (simplified)

---

## OpenClaw Routes (Gateway Integration)

### GET /api/openclaw/models
### POST /api/openclaw/orchestra
### GET /api/openclaw/sessions
- **GET:** List all OpenClaw sessions
- `supabase.from('openclaw_sessions').select('*')` → `db.getOpenClawSession()` ✅ MIGRATED ✅

### POST /api/openclaw/sessions
- **POST:** Create OpenClaw session
- `supabase.from('openclaw_sessions').insert({...})` → `db.createOpenClawSession()` ✅ MIGRATED ✅

### GET /api/openclaw/sessions/[id]
- **GET:** Fetch single OpenClaw session
- `supabase.from('openclaw_sessions').select('*').eq('id', id).single()` → `db.getOpenClawSession(id)` ✅ MIGRATED ✅

### PATCH /api/openclaw/sessions/[id]
- **PATCH:** Update OpenClaw session
- `supabase.from('openclaw_sessions').update(...).eq('id', id)` → `db.updateOpenClawSession(id, updates)` ✅ MIGRATED ✅

### DELETE /api/openclaw/sessions/[id]
- **DELETE:** Delete OpenClaw session
- `supabase.from('openclaw_sessions').delete().eq('id', id)` → `db.deleteOpenClawSession(id)` ✅ MIGRATED ✅

### GET /api/openclaw/sessions/[id]/history
- **DB:** none — OpenClaw Gateway history proxy endpoint

### GET /api/openclaw/status
- **DB:** mostly direct OpenClaw Gateway HTTP calls, with DB enrichment:
  - `supabase.from('agents').select('*')` → `db.getAgents()` ✅
  - `supabase.from('openclaw_sessions').select('*')` → `db.getOpenClawSession()` ✅ MIGRATED ✅
  - `supabase.from('events').select('*')` → `db.getEvents()` ✅

---

## Task Routes

### GET /api/tasks
- **GET:** List all tasks
- `supabase.from('tasks').select('*')` → `db.getTasks(workspaceId, filters)` ✅

### POST /api/tasks
- **POST:** Create task
- `supabase.from('tasks').insert({...})` → `db.createTask(task)` ✅

### GET /api/tasks/[id]
- **GET:** Fetch single task
- `supabase.from('tasks').select('*').eq('id', id).single()` → `db.getTask(id)` ✅

### PATCH /api/tasks/[id]
- **PATCH:** Update task
- `supabase.from('tasks').update(...).eq('id', id)` → `db.updateTask(id, data)` ✅

### DELETE /api/tasks/[id]
- **DELETE:** Delete task
- `supabase.from('tasks').delete().eq('id', id)` → `db.deleteTask(id)` ✅

### POST /api/tasks/[id]/dispatch
- **POST:** Dispatch task (mark status change + activity)
- `supabase.from('tasks').select('*')` → `db.getTask(id)` ✅
- `supabase.from('task_activities').insert({...})` → `db.createActivity(activity)` ✅
- `supabase.from('tasks').update({...})` → `db.updateTask(id, data)` ✅

### GET /api/tasks/[id]/activities
- **GET:** List task activities
- `supabase.from('task_activities').select('*').eq('task_id', taskId)` → `db.getActivities(taskId)` ✅ MIGRATED ✅

### POST /api/tasks/[id]/activities
- **POST:** Create activity
- `supabase.from('task_activities').insert({...})` → `db.createActivity(activity)` ✅ MIGRATED ✅

### GET /api/tasks/[id]/deliverables
- **GET:** List task deliverables
- `supabase.from('task_deliverables').select('*').eq('task_id', taskId)` → `db.getDeliverables(taskId)` ✅ MIGRATED ✅

### POST /api/tasks/[id]/deliverables
- **POST:** Create deliverable
- `supabase.from('task_deliverables').insert({...})` → `db.createDeliverable(deliverable)` ✅ MIGRATED ✅

### PATCH /api/tasks/[id]/deliverables/[delId]
- **PATCH:** Update deliverable
- `supabase.from('task_deliverables').update(...).eq('id', delId)` → `db.updateDeliverable(id, data)` ✅ MIGRATED ✅

### DELETE /api/tasks/[id]/deliverables/[delId]
- **DELETE:** Delete deliverable
- `supabase.from('task_deliverables').delete().eq('id', delId)` → `db.deleteDeliverable(id)` ✅ MIGRATED ✅

### GET /api/tasks/[id]/fail
- **POST:** Mark task as failed
- `supabase.from('tasks').select('*')` → `db.getTask(id)` ✅ MIGRATED ✅
- `supabase.from('task_activities').insert({...})` → `db.createActivity(activity)` ✅ MIGRATED ✅

### GET /api/tasks/[id]/planning/answer
- **POST:** Answer planning question
- `supabase.from('planning_questions').select('*')` → `db.getPlanningQuestion(id)` ✅ MIGRATED ✅

### POST /api/tasks/[id]/planning/approve
- **POST:** Approve planning spec
- `supabase.from('planning_specs').select('*')` → `db.getPlanningSpec(id)` ✅ MIGRATED ✅
- `supabase.from('task_activities').insert({...})` → `db.createActivity(activity)` ✅ MIGRATED ✅
- `supabase.from('tasks').update({...})` → `db.updateTask(id, data)` ✅ MIGRATED ✅

### POST /api/tasks/[id]/planning/poll
- **POST:** Poll planning status
- `supabase.from('tasks').select('*')` → `db.getTask(id)` ✅ MIGRATED ✅
- `supabase.from('planning_questions').select('*')` → `db.getPlanningQuestionsByTask()` ✅ MIGRATED ✅
- `supabase.from('planning_specs').select('*')` → `db.getPlanningSpecsByTask()` ✅ MIGRATED ✅

### POST /api/tasks/[id]/planning/retry-dispatch
- **POST:** Retry task dispatch
- `supabase.from('task_activities').insert({...})` → `db.createActivity(activity)` ✅ MIGRATED ✅
- `supabase.from('tasks').update({...})` → `db.updateTask(id, data)` ✅ MIGRATED ✅

### GET /api/tasks/[id]/planning
- **GET:** Fetch planning info
- `supabase.from('planning_questions').select('*')` → `db.getPlanningQuestionsByTask()` ✅ MIGRATED ✅

### POST /api/tasks/[id]/planning
- **POST:** Create planning question
- `supabase.from('planning_questions').insert({...})` → `db.createPlanningQuestion(question)` ✅ MIGRATED ✅

### GET /api/tasks/[id]/roles
- **GET:** List task roles
- `supabase.from('task_roles').select('*')` → `db.getTaskRoles(taskId)` ✅ MIGRATED ✅

### POST /api/tasks/[id]/roles
- **POST:** Create task role
- `supabase.from('task_roles').insert({...})` → `db.createTaskRole(role)` ✅ MIGRATED ✅

### PATCH /api/tasks/[id]/roles/[roleId]
- **PATCH:** Update task role
- `supabase.from('task_roles').update(...).eq('id', roleId)` → `db.updateTaskRole(id, data)` ✅ MIGRATED ✅

### POST /api/tasks/[id]/subagent
- **POST:** Spawn subagent
- `supabase.from('openclaw_sessions').insert({...})` → `db.createOpenClawSession(session)` ✅ MIGRATED ✅
- `supabase.from('task_activities').insert({...})` → `db.createActivity(activity)` ✅ MIGRATED ✅

### POST /api/tasks/[id]/test
- **POST:** Test task
- `supabase.from('task_activities').insert({...})` → `db.createActivity(activity)` ✅ MIGRATED ✅
- `supabase.from('tasks').update({...})` → `db.updateTask(id, data)` ✅ MIGRATED ✅

---

## Workspace Routes

### GET /api/workspaces
- **GET:** List all workspaces (optionally with stats)
- `supabase.from('workspaces').select('*')` → `db.getWorkspaces()` ✅
- `supabase.from('agents').select('*', { count: 'exact' })` (enrichment) → `db.getAgents(workspaceId)` ✅
- `supabase.from('tasks').select('status')` (enrichment) → `db.getTasks(workspaceId)` ✅

### POST /api/workspaces
- **POST:** Create workspace
- `supabase.from('workspaces').insert({...})` → `db.createWorkspace(workspace)` ✅

### GET /api/workspaces/[id]
- **GET:** Fetch single workspace
- `supabase.from('workspaces').select('*').eq('id', id).single()` → `db.getWorkspace(id)` ✅

### PATCH /api/workspaces/[id]
- **PATCH:** Update workspace
- `supabase.from('workspaces').update(...).eq('id', id)` → `db.updateWorkspace(id, data)` ✅

### DELETE /api/workspaces/[id]
- **DELETE:** Delete workspace
- `supabase.from('workspaces').delete().eq('id', id)` → `db.deleteWorkspace(id)` ✅

### GET /api/workspaces/[id]/knowledge
- **GET:** List knowledge entries
- `supabase.from('knowledge_entries').select('*')` → `db.getKnowledgeEntries()` ✅ MIGRATED ✅

### POST /api/workspaces/[id]/knowledge
- **POST:** Create knowledge entry
- `supabase.from('knowledge_entries').insert({...})` → `db.createKnowledgeEntry(entry)` ✅ MIGRATED ✅

### PATCH /api/workspaces/[id]/knowledge/[entryId]
- **PATCH:** Update knowledge entry
- `supabase.from('knowledge_entries').update(...).eq('id', entryId)` → `db.updateKnowledgeEntry(id, data)` ✅ MIGRATED ✅

### GET /api/workspaces/[id]/workflows
- **GET:** List workflow templates
- `supabase.from('workflow_templates').select('*')` → `db.getWorkflowTemplates(workspaceId)` ✅ MIGRATED ✅

### POST /api/workspaces/[id]/workflows
- **POST:** Create workflow template
- `supabase.from('workflow_templates').insert({...})` → `db.createWorkflowTemplate(template)` ✅ MIGRATED ✅

### PATCH /api/workspaces/[id]/workflows/[templateId]
- **PATCH:** Update workflow template
- `supabase.from('workflow_templates').update(...).eq('id', templateId)` → `db.updateWorkflowTemplate(id, data)` ✅ MIGRATED ✅

---

## Summary of Gaps & Needed Changes

### New Methods Required in `DbProvider`

1. **Agent operations:**
   - `getAgentsExcluding(workspaceId: string): Promise<Agent[]>` — list agents NOT in workspace
   - `upsertAgents(agents: Agent[]): Promise<Agent[]>` — bulk upsert

2. **OpenClaw Session operations:** (may stay Supabase-only)
   - `getOpenClawSession(id: string): Promise<any | undefined>`
   - `createOpenClawSession(session: any): Promise<any>`
   - `updateOpenClawSession(id: string, data: any): Promise<any>`
   - `deleteOpenClawSession(id: string): Promise<void>`

3. **Task Role operations:**
   - `getTaskRoles(taskId: string): Promise<any[]>`
   - `createTaskRole(role: any): Promise<any>`
   - `updateTaskRole(id: string, data: any): Promise<any>`
   - `deleteTaskRole(id: string): Promise<void>`

4. **Event operations:**
   - `updateEvent(id: string, data: Partial<Event>): Promise<Event>` — currently missing

5. **Checkpoint operations:**
   - Current methods assume `agent_id` as primary key, but route uses `checkpoint_id` — need clarification on table schema

### Notes

- **Dispatch/Heartbeats routes:** These are Phase 4 extensions and use `src/lib/db/dispatch/` directly. They do NOT migrate to the DbProvider pattern.
- **OpenClaw routes:** Mix of Gateway HTTP calls and Supabase DB calls. DB calls are marked separately.
- **File routes:** Pure file handling, no DB migrations needed.
- **Events/Stream route:** SSE endpoint, no direct DB calls.
- **Health route:** Minimal check, simplified to use `db.getWorkspaces()`.

