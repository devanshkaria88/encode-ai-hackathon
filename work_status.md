# GovMind — Work Status & Handoff Document

**Last updated:** Friday, March 20, 2026 — ~10:15 PM  
**Hackathon:** Encode AI London 2026 (March 20–22)  
**Builder:** Devansh  
**Repo:** https://github.com/devanshkaria88/encode-ai-hackathon  
**PRD:** `PRD.md` in repo root (the authoritative spec — always defer to it)

---

## What GovMind Is

An autonomous AI governance operator for DAOs, deployed as a Luffa bot + real-time dashboard. It reads proposals, fights voter apathy, monitors treasury health, and detects governance attacks — all inside Luffa's encrypted group chat.

One Claude agent, one system prompt, 15 tools. The agent decides which tools to use based on the trigger and context.

---

## Current Build Status

### What's Working

| Capability | Status | Notes |
|---|---|---|
| NestJS backend | Running | Watch mode via `yarn start:dev`, port 3001 |
| PostgreSQL database | Connected | Docker container `myman-pg-local`, DB `govmind`, user `myman` |
| Seed data | Populated | `npm run seed` (tsx) — MetaDAO with 15 members, 8 proposals, votes, treasury, attack pattern |
| Claude agent loop | Working | Tool-calling loop with 15 tools, 120s timeout, max 10 iterations |
| Luffa bot polling | Working | Polls `/receive`, auto-learns group ID from first message |
| Luffa message sending | Working | Group messages and DMs via `/send` and `/sendGroup` |
| Proposal intelligence | Working | Agent fetches and summarizes proposals on trigger or question |
| Treasury analysis | Working | Agent queries treasury data, generates charts, answers questions |
| Vote nudging | Working | Agent checks participation, identifies non-voters |
| Attack detection | Working | Agent scans token transfers for suspicious patterns |
| Knowledge storage | Working | Agent stores and retrieves team corrections |
| Chart generation | Working | chartjs-node-canvas, PNG output to `public/charts/` |
| Dashboard WebSocket | Working | Socket.IO, real-time tool call events |
| Dashboard UI | Working | Three-panel layout on port 3002 |
| Graph workspace | Working | All 15 tool nodes visible, traversal path lights up |
| Manual triggers | Working | POST endpoints under `/trigger/*` |

### Known Issues / Recent Fixes

1. **Tool result JSON truncation (FIXED)** — `get_treasury_transactions` and `query_data` could return large arrays. When stringified and truncated mid-string, the resulting broken JSON crashed the Anthropic SDK on the next API call. Fixed by:
   - Pre-truncating data structures before stringification (arrays capped at 10 items, strings at 300 chars, max depth 3)
   - Compact JSON (no pretty-print indentation)
   - Final string cap at 2000 chars
   - See `truncateToolResult()` at bottom of `agent.service.ts`

2. **Group ID auto-learning (FIXED)** — Originally required a hardcoded `LUFFA_GROUP_ID` env var. Now the `LuffaPollingService` auto-learns the group ID from the first incoming group message. The agent uses `lastKnownGroupId` for proactive messages and `replyTo.uid` for reactive ones.

3. **Agent timeout (FIXED)** — Was 30s, increased to 120s. A full agent run with multiple tool calls takes 15-40 seconds.

### What's NOT Built Yet

| Feature | PRD Section | Priority | Notes |
|---|---|---|---|
| Vote nudge DMs to specific members | Capability 2 | High | Agent identifies non-voters but DM nudging may need Luffa user ID mapping |
| Chart images sent to Luffa | Chart rules | Medium | Charts generate as PNG but sending images via Luffa API needs testing |
| Dashboard: response panel in workspace | Dashboard | Medium | The graph shows traversal but doesn't show the final text response inline |
| Demo sequence script | `demo-sequence.sh` | High | Curl commands in exact order for the 3-minute demo |
| README with screenshot | Git rules | Medium | Judges see this first |
| Backup demo video | Demo reliability | High | Record before Sunday presentation |

---

## Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                         Luffa Bot API                              │
│              (polling /receive, sending /send /sendGroup)          │
└──────────────┬─────────────────────────────┬───────────────────────┘
               │ incoming messages           │ outbound messages
               ▼                             ▲
┌──────────────────────────────────────────────────────────────────┐
│                      NestJS Backend (:3001)                      │
│                                                                  │
│  ┌──────────────┐    ┌─────────────────────────────────────┐     │
│  │ LuffaPolling │───▶│           AgentService               │     │
│  │   Service    │    │  Claude tool-calling loop (15 tools) │     │
│  └──────────────┘    │  ┌─────────┬─────────┬──────────┐   │     │
│                      │  │Governanc│Treasury │Security  │   │     │
│  ┌──────────────┐    │  │Service  │Service  │Service   │   │     │
│  │  Trigger     │───▶│  ├─────────┼─────────┼──────────┤   │     │
│  │  Controller  │    │  │Knowledge│ Chart   │  Luffa   │   │     │
│  │ /trigger/*   │    │  │Service  │Service  │ Service  │   │     │
│  └──────────────┘    │  └─────────┴─────────┴──────────┘   │     │
│                      └──────────┬──────────────────────────┘     │
│                                 │ WebSocket events               │
│                      ┌──────────▼──────────┐                     │
│                      │ DashboardGateway    │                     │
│                      │ (Socket.IO)         │                     │
│                      └──────────┬──────────┘                     │
│                                 │                                │
│                      ┌──────────▼──────────┐                     │
│                      │ DashboardController │                     │
│                      │ GET /api/health     │                     │
│                      └─────────────────────┘                     │
└──────────────────────────────────────────────────────────────────┘
               │ Socket.IO              │ REST /api/health
               ▼                        ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Next.js Dashboard (:3002)                       │
│                                                                  │
│  ┌──────────┐  ┌───────────────────┐  ┌────────────────────┐    │
│  │ LiveFeed │  │ AgentWorkspace    │  │    DaoHealth       │    │
│  │ (25%)    │  │ (45%) — graph     │  │    (30%)           │    │
│  │          │  │ with traversal    │  │ treasury + proposals│    │
│  └──────────┘  └───────────────────┘  └────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
encode-ai-hackathon/
├── .gitignore
├── PRD.md                          # Authoritative spec
├── LUFFA-SKILL.md                  # Luffa bot API research & docs
├── work_status.md                  # This file
├── research/
│   └── screenshot-operation-guide.png
├── backend/
│   ├── .env                        # Real credentials (gitignored)
│   ├── .env.example                # Template for env vars
│   ├── package.json
│   ├── test.md                     # Bot testing guide with curl commands
│   └── src/
│       ├── main.ts                 # Entry: CORS, static assets, port 3001
│       ├── app.module.ts           # Root module: TypeORM, all feature modules
│       ├── data-source.ts          # TypeORM DataSource for seed script
│       ├── database/seed.ts        # MetaDAO demo data seeder
│       ├── agent/
│       │   ├── agent.module.ts
│       │   ├── agent.service.ts    # Claude tool loop — THE core file
│       │   ├── agent.system-prompt.ts
│       │   └── agent.tools.ts      # 15 tool definitions
│       ├── governance/             # Proposals, votes, members
│       ├── treasury/               # Balances, transactions
│       ├── security/               # Token transfers, wallet profiles
│       ├── knowledge/              # Knowledge store, action log, nudge tracking
│       ├── chart/                  # chartjs-node-canvas PNG generation
│       ├── luffa/                  # Bot API polling + message sending
│       ├── dashboard/              # Socket.IO gateway + /api/health
│       └── trigger/                # Manual demo trigger endpoints
└── dashboard/
    ├── package.json
    ├── app/
    │   ├── globals.css             # Dark theme, dot-grid, animations
    │   ├── layout.tsx              # JetBrains Mono font
    │   ├── page.tsx                # Three-panel layout
    │   └── components/
    │       ├── Header.tsx          # Connection status
    │       ├── LiveFeed.tsx        # Luffa message stream
    │       ├── AgentWorkspace.tsx   # Graph visualization with traversal
    │       └── DaoHealth.tsx       # Treasury stats + proposals + trigger buttons
    └── lib/
        ├── store.ts                # Zustand: runs, steps, messages
        └── socket.ts               # Socket.IO client + event handlers
```

---

## How to Run

### Prerequisites
- Node 20 LTS
- PostgreSQL (Docker container `myman-pg-local` is already running)
- Luffa bot with a SecretKey

### Backend
```bash
cd backend
cp .env.example .env  # Fill in credentials
npm install
npm run seed          # Populate demo data
yarn start:dev        # Runs on :3001 with watch mode
```

### Dashboard
```bash
cd dashboard
npm install
npm run dev           # Runs on :3002
```

### Environment Variables (backend/.env)
```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=myman
DB_PASSWORD=<see .env file>
DB_NAME=govmind
LUFFA_ROBOT_SECRET=<bot secret key>
LUFFA_POLLING_ENABLED=true
ANTHROPIC_API_KEY=<claude api key>
PORT=3001
```

---

## Key Technical Decisions

1. **Polling, not webhooks** — Luffa bot API doesn't support webhooks. We poll `/receive` every 3 seconds. Deduplication by message ID.

2. **Single agent, not multi-agent** — One Claude instance with 15 tools. The system prompt tells it what it can do, and it picks the right tools per trigger.

3. **synchronize: true** — TypeORM auto-creates tables from entities. No migrations needed for hackathon.

4. **Graph-based workspace** — Dashboard center panel shows all 15 tool nodes as a network graph. When the agent runs, the traversal path lights up with animated edges and numbered badges.

5. **Tool result truncation** — Large query results caused JSON parse errors. Fixed with a recursive `truncateToolResult()` that caps arrays at 10 items, strings at 300 chars, depth at 3 levels before stringification.

6. **Auto-learned group ID** — Bot learns the Luffa group ID from the first incoming group message rather than requiring manual config.

---

## Trigger Endpoints (for demo)

All relative to `http://localhost:3001`:

| Endpoint | Method | Purpose |
|---|---|---|
| `/trigger/new-proposal` | POST | Agent summarizes latest proposal |
| `/trigger/vote-check` | POST | Agent checks voter participation |
| `/trigger/treasury-check` | POST | Agent assesses treasury health |
| `/trigger/attack-check` | POST | Agent scans for governance attacks |
| `/trigger/ask` | POST | Body: `{ "question": "..." }` — freeform agent query |
| `/trigger/poll-test` | GET | Debug: manually poll Luffa for messages |

---

## WebSocket Events (for dashboard)

All emitted from `DashboardGateway`:

| Event | Payload | When |
|---|---|---|
| `agent:start` | `{ trigger }` | Agent run begins |
| `agent:tool-start` | `{ tool, input, description }` | Tool call starting |
| `agent:tool-result` | `{ tool, result }` | Tool call completed |
| `agent:complete` | `{ response, steps }` | Agent finished successfully |
| `agent:error` | `{ error }` | Agent failed |
| `luffa:message-received` | `{ channel, text, senderUid }` | Incoming Luffa message |
| `luffa:message-sent` | `{ channel, text, recipientUid? }` | Outgoing Luffa message |

---

## Database Entities (9 tables)

| Entity | Table | Module |
|---|---|---|
| Proposal | proposals | governance |
| Vote | votes | governance |
| Member | members | governance |
| TreasuryTransaction | treasury_transactions | treasury |
| TreasuryBalance | treasury_balances | treasury |
| TokenTransfer | token_transfers | security |
| Knowledge | knowledge | knowledge |
| AgentAction | agent_actions | knowledge |
| NudgeTracking | nudge_tracking | knowledge |

---

## Agent Tools (15 total)

| Tool | Domain | Description |
|---|---|---|
| `get_active_proposals` | Governance | List all active proposals |
| `get_proposal_detail` | Governance | Full details for one proposal |
| `get_voting_status` | Governance | Vote tally + who voted |
| `get_member_vote_history` | Governance | One member's voting record |
| `get_treasury_summary` | Treasury | Balances, burn rate, runway |
| `get_treasury_transactions` | Treasury | Filtered transaction list |
| `get_token_transfers` | Security | Recent token movements |
| `get_wallet_profile` | Security | Wallet analysis for one address |
| `query_data` | Utility | Ad-hoc read-only SQL |
| `send_group_message` | Comms | Post to Luffa group chat |
| `send_direct_message` | Comms | DM a Luffa user |
| `generate_chart` | Utility | Create PNG chart (bar/line/pie/doughnut) |
| `get_knowledge` | Knowledge | Retrieve team corrections |
| `store_knowledge` | Knowledge | Save a new correction |
| `log_action` | Utility | Audit trail entry |

---

## What to Build Next (Saturday priorities)

1. **Demo sequence script** (`demo-sequence.sh`) — Exact curl commands in order for the 3-min demo. Practice timing.

2. **Dashboard polish** — The graph workspace could show the agent's final response text somewhere (maybe a panel below or a modal). The LiveFeed could show richer message formatting.

3. **Chart → Luffa** — Test sending PNG chart images through the Luffa bot API. Check if it supports image uploads or base64 inline.

4. **Vote nudge flow** — Make the DM nudge actually send personalized messages to non-voters. May need to map wallet addresses to Luffa user IDs (could be mocked for demo).

5. **README** — Screenshot of dashboard, architecture diagram, setup instructions, tech list, demo video link.

6. **Backup video** — Record a perfect demo run before the live presentation.

---

## Files the Next Agent Should Read First

1. `PRD.md` — The spec. Everything flows from this.
2. `backend/src/agent/agent.service.ts` — The core agent loop and all tool execution.
3. `backend/src/agent/agent.tools.ts` — Tool definitions Claude sees.
4. `backend/src/agent/agent.system-prompt.ts` — What the agent knows about itself.
5. `backend/test.md` — Testing guide with curl commands.
6. `dashboard/app/components/AgentWorkspace.tsx` — The graph visualization.
7. `LUFFA-SKILL.md` — Luffa bot API documentation and quirks.
8. `.cursor/rules/main-rule-md.mdc` — Engineering rules for all agents.
