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
   - `NEXT_PUBLIC_OPENCLAW_WS_URL` — WebSocket URL for OpenClaw Gateway (default: `ws://localhost:3111`)

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
| `NEXT_PUBLIC_OPENCLAW_WS_URL` | WebSocket URL for OpenClaw Gateway | `ws://localhost:3111` |

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

## Architecture

**Task Lifecycle:** Tasks enter the Kanban board in the `inbox` stage. A workflow engine manages stage transitions, assigning tasks to the correct agent based on the task's workflow template. As tasks progress (building → testing → review), the engine dispatches them to the assigned agent.

**Checkpoints:** Each agent can set a checkpoint (via the checkpoints table) to broadcast status in real time. The dashboard subscribes to the `checkpoints` table via Supabase Realtime. When an agent updates their checkpoint, all connected clients see the agent's status summary immediately without a page refresh.

**Event Stream:** The `events` table captures all significant actions (agent joined, task created, workflow transitions, etc.). The dashboard subscribes to this stream for real-time activity logs.

**OpenClaw Integration:** Agents are seeded with `gateway_agent_id` values that map to agents running in an OpenClaw Gateway instance. The app can dispatch tasks to agents via WebSocket, and agents report completion via webhooks.

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
