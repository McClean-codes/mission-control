# Mission Control

Multi-agent orchestration dashboard for OpenClaw teams. Features a Kanban board, workflow engine, real-time event feed, and agent checkpoints with live status updates.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, React
- **Backend:** Supabase (Postgres + Realtime WebSockets)
- **Deployment:** Vercel
- **Agent Platform:** OpenClaw Gateway integration

## Agent Team

| Name | Role | Emoji | Model |
|------|------|-------|-------|
| Sherlock | Coordinator | 🔍 | anthropic/claude-sonnet-4-6 |
| Edison | Architect | 💡 | anthropic/claude-opus-4-6 |
| Nikola | Analyst | ⚡ | anthropic/claude-sonnet-4-6 |
| Newton | Developer | 🍎 | anthropic/claude-haiku-4-5 |
| Scout | Ops | 🐕 | anthropic/claude-haiku-4-5 |

## Setup

### Prerequisites

- Node.js 18+ and npm
- A Supabase project (free tier available at https://supabase.com)

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/McClean-codes/mission-control.git
   cd mission-control
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.local.example .env.local
   ```
   Then edit `.env.local` with your credentials:
   - `NEXT_PUBLIC_SUPABASE_URL` — Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY` — Your Supabase service role key (for server-side auth)

4. **Set up the database schema:**
   - Log into your Supabase dashboard
   - Open the **SQL Editor**
   - Copy and paste the entire contents of `supabase/migrations/001_initial_schema.sql`
   - Click **Run** to apply all 17 tables, triggers, and Realtime subscriptions

5. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (public) | `https://abc123.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public) | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) | `eyJhbGciOi...` |

## Database Schema

The database schema is defined in SQL at `supabase/migrations/001_initial_schema.sql`. It includes:

- **Core:** workspaces, agents, tasks, conversations, messages
- **Workflow:** task_roles, task_activities, task_deliverables, workflow_templates
- **Planning:** planning_questions, planning_specs
- **Knowledge:** knowledge_entries
- **Live Status:** events, checkpoints (with Realtime enabled)

All tables use Postgres native types (TIMESTAMPTZ, BOOLEAN, JSONB). Realtime is enabled on `tasks`, `events`, `task_activities`, and `checkpoints` for live dashboard updates.

## Deployment (Vercel)

Mission Control is configured for seamless deployment to Vercel.

1. **Push to GitHub:**
   ```bash
   git push origin main
   ```

2. **Import in Vercel:**
   - Go to [https://vercel.com/new](https://vercel.com/new)
   - Select your GitHub repo
   - Click **Import**

3. **Add environment variables:**
   - In Vercel project settings, add the 4 env vars from `.env.local.example`
   - Use your production Supabase credentials

4. **Deploy:**
   - Click **Deploy**
   - Your app will be live at `https://<project>.vercel.app`

## Dispatch Watcher (VM Setup)

The dispatch watcher is a Node.js process that runs alongside OpenClaw Gateway on your local machine (or any machine with internet access). It bridges Supabase dispatch requests to local agent execution.

### Prerequisites

- Node.js 18+
- OpenClaw Gateway running locally
- Internet access (for Supabase connectivity)

### Setup

1. **Configure the watcher:**
   ```bash
   cp scripts/dispatch-watcher.env.example scripts/.env
   ```

2. **Edit `scripts/.env` with your settings:**
   - `SUPABASE_URL` — Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` — Your Supabase service role key
   - `OPENCLAW_GATEWAY_URL` — Local Gateway URL (default: `http://localhost:3377`)
   - `AGENT_IDS` — Comma-separated agent IDs (default: `sherlock,edison,nikola,newton,scout`)

3. **Start the watcher:**
   ```bash
   npm run dispatch:watch
   ```

4. **With systemd or pm2 (production):**
   ```bash
   # pm2
   pm2 start "npm run dispatch:watch" --name dispatch-watcher --env-file scripts/.env
   
   # systemd
   # Create /etc/systemd/system/mission-control-watcher.service with ExecStart=/path/to/mission-control/node_modules/.bin/tsx /path/to/mission-control/scripts/dispatch-watcher.ts
   ```

### What the Watcher Does

- Subscribes to `dispatch_queue` via Supabase Realtime
- Listens for pending tasks assigned to its agents
- Claims tasks atomically (prevents race conditions)
- Executes tasks via local OpenClaw Gateway API
- Updates task status in Supabase (pending → running → completed)
- Sends agent heartbeats every 30 seconds (status shown on dashboard as 🟢/🟡/🔴)
- Handles graceful shutdown on SIGTERM (final offline heartbeat)

## Architecture

```
Vercel (Dashboard) ──────────┐
                              ↓
                         Supabase
                         ↑       ↑
                         │       │
                    HTTP/WSS  Realtime
                         │       │
                         └───────┘
                              ↑
                    VM (Dispatch Watcher)
                              ↑
                         OpenClaw Gateway
```

**Dispatch Flow:** Dashboard dispatches tasks via `POST /api/dispatch` → inserts into `dispatch_queue` table (status=pending). The dispatch watcher (running on the VM) subscribes to `dispatch_queue` via Supabase Realtime. On new pending task, watcher claims it atomically, executes via local OpenClaw Gateway, and updates the queue with result. Dashboard observes status changes in real-time without polling.

**Task Lifecycle:** Tasks enter the Kanban board in the `inbox` stage. A workflow engine manages stage transitions, assigning tasks to the correct agent based on the task's workflow template. As tasks progress (building → testing → review), the engine updates task status, which triggers event logging.

**Agent Status:** The dispatch watcher sends heartbeats every 30 seconds by upserting `agent_heartbeats`. Dashboard subscribes to this table and displays agent status:
- 🟢 Online (heartbeat < 60s ago)
- 🟡 Stale (60–300s ago)
- 🔴 Offline (> 300s ago or never seen)

**Checkpoints:** Each agent can set a checkpoint to broadcast progress. Checkpoints appear as status lines on agent cards in real-time.

**Event Stream:** The `events` table captures all significant actions (task created, dispatch claimed, task completed, etc.). Dashboard subscribes for real-time activity logs.

## Available Scripts

- `npm run dev` — Start dev server on port 3000
- `npm run build` — Build for production
- `npm start` — Start production server
- `npm run lint` — Run ESLint

## Migration Notes

Mission Control was migrated from a SQLite-based Autensa fork to a Supabase-backed system:

- **SQLite → Postgres:** All data access now uses Supabase query builder (`.from().select().eq()` etc.)
- **Generic agents → OpenClaw team:** The bootstrap seeder creates our 5-agent team (Sherlock, Edison, Nikola, Newton, Scout) on first run
- **Docker → Vercel:** Deployment is simplified via Vercel; Docker config has been removed
- **Checkpoints:** Added the `checkpoints` table with Supabase Realtime for live agent status
- **WebSocket dispatch → Supabase message bus:** Task dispatch moved from direct browser-to-Gateway WebSocket to Supabase `dispatch_queue`. Dispatch watcher (running on VM) subscribes to Supabase Realtime, claims tasks, and executes via local OpenClaw Gateway. No direct connectivity needed between Vercel and VM.

## Contributing

To contribute:

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit your changes: `git commit -m "feat: description"`
3. Push to GitHub: `git push origin feature/your-feature`
4. Open a PR against `main`

## License

MIT

## Support

For issues, questions, or feedback:
- Open an issue on [GitHub](https://github.com/McClean-codes/mission-control/issues)
- Join our community Discord for updates and discussion
