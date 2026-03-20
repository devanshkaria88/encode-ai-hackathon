# GovMind — Product Requirements Document

## Hackathon: Encode AI London 2026 (March 20–22)
**Tracks:** AI Agents (main) + LuffaNator (partner) + LuffaNation (stretch)
**Team:** 2 people — 1 builder (Devansh), 1 business/product
**Submission:** Demo video (3 min), Pitch deck, Public GitHub repo

---

## 1. One-Liner

**GovMind is an autonomous AI governance operator for DAOs — deployed as a Luffa bot — that reads proposals, fights voter apathy, monitors treasury health, and detects governance attacks, all inside end-to-end encrypted group chat.**

---

## 2. The Problem

DAOs collectively manage billions in assets but are plagued by operational dysfunction:

**Voter Apathy:** On average, fewer than 10% of token holders participate in governance votes. Proposals that affect millions of dollars pass with a handful of votes. Members don't vote because proposals are long, technical, and hard to understand — and nobody reminds them.

**Treasury Mismanagement:** DAOs hold volatile crypto assets with no professional finance oversight. Treasuries are over-concentrated in single tokens, burn rates go unmonitored, and runway calculations require manually checking blockchain explorers that most team members can't read.

**Governance Attacks:** Malicious actors accumulate tokens to pass proposals that drain treasuries. The community often doesn't notice until it's too late because monitoring governance contracts requires technical expertise and constant vigilance.

**Information Asymmetry:** The 3-5 core contributors who understand the technical details make decisions while the broader community rubber-stamps or ignores them — not because they don't care, but because they can't parse the information.

**These problems interact:** low participation enables whale dominance, which enables governance attacks, which drains the treasury, which kills the DAO. It's a death spiral that starts with "nobody read the proposal."

### Why Current Solutions Fail

- **Snapshot/Tally (voting platforms):** Handle the mechanics of voting but do nothing about comprehension or participation. They're the ballot box, not the informed electorate.
- **Dune Analytics dashboards:** Require SQL knowledge. Show data, don't interpret it or alert on it.
- **Discord bots (existing governance bots):** Post raw proposal text into a channel. Nobody reads walls of text. No intelligence, no summarisation, no personalisation.
- **Manual monitoring:** Core contributors watch governance contracts, treasury wallets, and voting patterns by hand. This doesn't scale and creates single points of failure.

### Why This Needs to Be on Luffa (Not Slack/Discord)

1. **E2EE Encryption:** Governance strategy discussions are sensitive. "Should we vote against this whale's proposal?" is a conversation that must be private. Luffa's end-to-end encryption means not even Luffa can read the messages. Discord and Slack store everything in plaintext on corporate servers.
2. **Built-in Wallet (Endless Chain):** Members can execute treasury actions (transfers, vote confirmations) directly from the chat. No switching to MetaMask. Query → Decide → Act in one encrypted conversation.
3. **Token-Gated Groups:** Only governance token holders can join the Luffa group. Access control is on-chain, not admin-managed. This IS the DAO's membership system.
4. **DID-Based Identity:** Every message is tied to a decentralised identity, creating a cryptographically verifiable audit trail. "Who asked about the treasury at 3am?" has a provable answer.

**The one-sentence test:** "Why Luffa and not Slack?" → "Because you don't discuss governance strategy on an unencrypted platform, and you can't vote or move treasury funds from Slack."

---

## 3. What GovMind Does (Four Capabilities, One Agent)

GovMind is NOT four separate products or four separate agents. It is **one autonomous agent with one mission: keep the DAO healthy.** It uses different capabilities depending on what's happening.

### Capability 1: Proposal Intelligence

**Trigger:** New proposal appears on-chain (or in the seeded database for hackathon demo).

**What the agent does autonomously:**
- Detects the new proposal
- Reads the full proposal text
- Generates a plain-English summary (2-3 sentences) with key impacts
- Identifies financial implications ("This would allocate 45 ETH — 31% of remaining treasury")
- Performs a risk assessment on the proposer (wallet age, previous proposals, token holding history)
- Posts the summary to the Luffa group with a risk rating (Low / Medium / High / Critical)
- Suggests follow-up questions the community should ask before voting

**Example Luffa message from GovMind:**

```
📋 New Proposal: #48 — "Fund Marketing Sprint Q2"

Summary: Requests 45 ETH ($90,000) from treasury to fund a 
3-month marketing campaign targeting DeFi users. Proposed by 
0x7f3a...council (core contributor, 12 previous proposals).

💰 Treasury Impact: Would reduce treasury from 142 ETH to 97 ETH. 
   Runway drops from 6.2 months to 4.2 months at current burn.

⚠️ Risk: MEDIUM
   - Large allocation (31% of treasury) for single initiative
   - No milestone-based disbursement — full amount upfront
   - Proposer is a known contributor (lower risk)

🗳 Voting closes: March 25 (5 days)
   Current: 3 votes FOR, 0 AGAINST (of 47 eligible voters)

Questions the community should consider:
→ Can this be structured as milestone-based payments?
→ What are the success metrics for the campaign?
→ Is 45 ETH market-rate for this scope?
```

### Capability 2: Vote Mobilisation (Anti-Apathy Engine)

**Trigger:** Active proposal with low participation as deadline approaches.

**What the agent does autonomously:**
- Tracks voting status for all active proposals
- Identifies members who haven't voted yet
- Calculates urgency based on time remaining and current participation rate
- Sends personalised, contextual nudges (not spam — timed and relevant)
- Adapts tone based on urgency: casual reminder → firm nudge → final warning

**Nudge strategy (autonomous decision-making):**
- At 50% time elapsed with <20% participation: General reminder to group
- At 75% time elapsed: Personalised DM to non-voters with a one-line summary
- At 90% time elapsed: Final call with stakes made explicit ("This passes with 4 votes controlling $90k")

**Example personalised nudge:**

```
Hey Alice 👋 Proposal #48 (Marketing Sprint, 45 ETH) closes 
in 12 hours and you haven't voted yet.

Quick take: This would cut runway to 4.2 months. You voted 
AGAINST a similar-sized allocation in Proposal #31 last month.

Only 8 of 47 members have voted — your vote carries significant 
weight right now.

🗳 Vote: [link to governance portal]
```

**Why this is autonomous, not a cron job:** The agent decides WHEN to nudge, WHO to nudge, and WHAT to say based on the current state of the proposal, the member's voting history, and the DAO's context. A cron job would send the same message to everyone at the same time.

### Capability 3: Treasury Health Monitor

**Trigger:** Periodic monitoring (every hour in production; on-demand for demo) + any treasury-related question in chat.

**What the agent does autonomously:**
- Monitors treasury wallet balances and tracks changes
- Calculates burn rate (rolling 30-day average of outflows)
- Calculates runway (treasury balance / burn rate)
- Detects concentration risk (percentage of treasury in a single asset)
- Flags unusual outflows (transactions larger than 2x the average)
- Answers ad-hoc treasury questions from the Luffa group in natural language

**Autonomous alerts (agent decides when to alert):**

```
🚨 Treasury Alert: Concentration Risk

82% of treasury is in $GOV token. If $GOV drops 30% 
(within normal volatility range), runway drops from 
6.2 months to 3.1 months.

Recommendation: Consider diversifying 20-30% into 
stablecoins (USDC/DAI) to protect runway.

Current allocation:
  $GOV:  116.5 ETH (82%)
  USDC:  18.2 ETH equivalent (13%)
  DAI:   7.6 ETH equivalent (5%)
```

**Ad-hoc question answering:**

```
Bob: @govmind what's our runway?

GovMind: 📊 Current runway: 6.2 months
  Treasury: 142.3 ETH ($284,600)
  Monthly burn: 23.1 ETH (30-day rolling avg)
  
  [Burn trend chart: last 6 months]
  
  Note: Burn has increased 15% this month due to 
  the dev bounty program. If this rate continues, 
  runway adjusts to 5.4 months.
```

### Capability 4: Governance Attack Detection

**Trigger:** Continuous monitoring of voting patterns, token movements, and proposal activity.

**What the agent does autonomously:**
- Monitors token transfer activity before and during active votes
- Detects suspicious voting patterns (sudden concentration, last-minute vote dumps)
- Flags proposals from new/unknown wallets requesting treasury access
- Detects flash-loan-style governance attacks (rapid accumulation → vote → dump)
- Alerts the Luffa group with evidence and recommended actions

**Example alert:**

```
🔴 GOVERNANCE ALERT: Suspicious Activity on Proposal #49

I've detected unusual patterns:

1. Wallet 0x9e2b...unknown (created 3 days ago) submitted 
   a proposal to transfer 80 ETH to an external address
2. In the last 24 hours, 3 wallets acquired a combined 
   12,000 $GOV tokens (enough for 18% voting power)
3. All 3 wallets funded from the same source address
4. These wallets have already voted FOR the proposal

Risk: CRITICAL — This pattern matches a governance attack. 
A coordinated group may be trying to drain the treasury.

Recommended actions:
→ DO NOT vote FOR this proposal
→ Core contributors should review immediately
→ Consider emergency governance pause if your contracts support it

Evidence: [transaction hashes and timing analysis]
```

---

## 4. System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      LUFFA PLATFORM                          │
│                                                              │
│  ┌──────────────────┐          ┌──────────────────┐          │
│  │  DAO Group Chat  │◄────────►│  GovMind Bot     │          │
│  │  (token-gated,   │          │  (Luffa Bot      │          │
│  │   E2EE)          │          │   Account)       │          │
│  └──────────────────┘          └────────┬─────────┘          │
└─────────────────────────────────────────┼────────────────────┘
                                          │ Webhooks (HTTP POST)
                                          ▼
┌──────────────────────────────────────────────────────────────┐
│                 GOVMIND BACKEND (NestJS)                      │
│                                                              │
│  ┌──────────────┐                                            │
│  │  Webhook      │  Receives messages from Luffa             │
│  │  Controller   │  + Scheduled triggers (cron)              │
│  └──────┬───────┘                                            │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────────────────────────────────────────────┐    │
│  │              GOVERNANCE AGENT (Claude)                 │    │
│  │                                                        │    │
│  │  System prompt: "You are GovMind, an autonomous        │    │
│  │  governance operator for a DAO..."                     │    │
│  │                                                        │    │
│  │  Tools available:                                      │    │
│  │  ┌─────────────────┐  ┌──────────────────┐            │    │
│  │  │ get_proposals    │  │ get_treasury     │            │    │
│  │  │ get_votes        │  │ get_token_flows  │            │    │
│  │  │ get_members      │  │ get_burn_rate    │            │    │
│  │  │ get_wallet_info  │  │ query_data       │            │    │
│  │  │ send_group_msg   │  │ send_dm          │            │    │
│  │  │ generate_chart   │  │ get_vote_history │            │    │
│  │  │ get_knowledge    │  │ store_knowledge  │            │    │
│  │  └─────────────────┘  └──────────────────┘            │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐   ┌───────────────┐   │
│  │  Data Layer   │    │  Chart Gen   │   │  WebSocket    │   │
│  │  (PostgreSQL) │    │  (chartjs-   │   │  Server       │   │
│  │              │    │  node-canvas) │   │  (Dashboard)  │   │
│  └──────────────┘    └──────────────┘   └───────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                         │
              WebSocket connection
                         ▼
┌──────────────────────────────────────────────────────────────┐
│              GOVMIND DASHBOARD (Next.js)                      │
│                                                              │
│  Real-time observability into agent reasoning:               │
│  - Live feed of Luffa group messages                         │
│  - Agent's tool calls and reasoning steps (animated)         │
│  - Treasury charts and health metrics                        │
│  - Active proposals with voting status                       │
│  - Team knowledge base                                       │
│  - Governance attack alerts                                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Data Model

GovMind uses a PostgreSQL database that serves dual purpose: it stores the agent's own state AND acts as the mock on-chain data source for the hackathon demo. In production, the on-chain data would come from actual blockchain indexers.

### DAO Governance Data (Mocked for demo, would be indexed from chain in production)

**proposals** — Governance proposals submitted by members

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Internal ID |
| proposal_number | INT | Human-readable proposal number (e.g., #48) |
| title | TEXT | Proposal title |
| body | TEXT | Full proposal text (markdown) |
| proposer_address | TEXT | Wallet address of proposer |
| requested_amount | DECIMAL | Amount of ETH/tokens requested |
| recipient_address | TEXT | Where funds would go |
| status | ENUM | 'active', 'passed', 'rejected', 'executed', 'cancelled' |
| vote_start | TIMESTAMP | When voting opened |
| vote_end | TIMESTAMP | When voting closes |
| created_at | TIMESTAMP | When proposal was submitted |

**votes** — Individual votes cast on proposals

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | |
| proposal_id | INT FK | Links to proposals |
| voter_address | TEXT | Wallet address of voter |
| vote | ENUM | 'for', 'against', 'abstain' |
| voting_power | DECIMAL | Token-weighted voting power |
| voted_at | TIMESTAMP | When the vote was cast |

**members** — DAO governance token holders

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | |
| address | TEXT UNIQUE | Wallet address |
| display_name | TEXT | Human-readable name (if set) |
| token_balance | DECIMAL | Current governance token balance |
| join_date | TIMESTAMP | When they first acquired tokens |
| luffa_user_id | TEXT | Mapped Luffa user ID (for DMs) |

**treasury_transactions** — All inflows and outflows from the DAO treasury

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | |
| tx_hash | TEXT | Transaction hash |
| direction | ENUM | 'inflow', 'outflow' |
| amount | DECIMAL | Amount in ETH |
| token | TEXT | Token symbol (ETH, USDC, GOV, etc.) |
| counterparty | TEXT | Wallet address of other party |
| category | TEXT | 'contributor_payment', 'grant', 'swap', 'revenue', etc. |
| memo | TEXT | Description of transaction |
| timestamp | TIMESTAMP | When it happened |

**treasury_balances** — Current snapshot of treasury holdings

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | |
| token | TEXT | Token symbol |
| balance | DECIMAL | Current balance |
| usd_value | DECIMAL | USD equivalent |
| percentage | DECIMAL | % of total treasury |
| updated_at | TIMESTAMP | |

**token_transfers** — Token movements relevant to governance (for attack detection)

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | |
| from_address | TEXT | Sender |
| to_address | TEXT | Receiver |
| amount | DECIMAL | Tokens transferred |
| timestamp | TIMESTAMP | |

### Agent State Data (GovMind's own memory)

**knowledge** — Team corrections and definitions (same as AskVault concept)

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | |
| term | TEXT | e.g., "runway", "core contributor" |
| definition | TEXT | e.g., "runway excludes locked staking positions" |
| source_user | TEXT | Who provided the correction |
| created_at | TIMESTAMP | |

**agent_actions_log** — Everything the agent has done (for dashboard + audit)

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | |
| action_type | TEXT | 'proposal_summary', 'vote_nudge', 'treasury_alert', 'attack_alert', 'query_answer' |
| trigger | TEXT | 'scheduled', 'new_proposal', 'user_question', 'anomaly_detected' |
| reasoning | TEXT | Agent's reasoning chain (why it took this action) |
| tools_used | JSONB | Array of tool calls made |
| message_sent | TEXT | What was sent to Luffa |
| created_at | TIMESTAMP | |

**nudge_tracking** — Tracks which members have been nudged for which proposals (prevents spam)

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | |
| proposal_id | INT FK | |
| member_address | TEXT | |
| nudge_level | INT | 1 = gentle, 2 = firm, 3 = final |
| sent_at | TIMESTAMP | |

---

## 6. Agent Design

### Why ONE Agent, Not Multiple

The four capabilities (proposal intelligence, vote mobilisation, treasury health, attack detection) are NOT four agents. They are four TOOLS available to a single agent with a single system prompt.

The agent receives triggers (new message in Luffa, scheduled cron, new proposal detected) and autonomously decides what to do. Sometimes that's summarising a proposal. Sometimes it's nudging a voter. Sometimes it's answering a treasury question. The same agent, different tools, different situations.

This is honest architecture. Multi-agent would be justified if the capabilities needed to run in parallel or debate with each other. They don't. A proposal summary doesn't need to "negotiate" with the treasury monitor. They're sequential capabilities of one governance brain.

### Agent Tools

| Tool Name | Description | When Used |
|-----------|-------------|-----------|
| `get_active_proposals` | Returns all proposals with status 'active', including vote tallies | Proposal intelligence, vote mobilisation |
| `get_proposal_detail` | Returns full text and metadata for a specific proposal | Proposal summarisation |
| `get_voting_status` | Returns who has voted and who hasn't for a given proposal | Vote mobilisation |
| `get_member_vote_history` | Returns a member's past voting record and patterns | Personalised nudges |
| `get_treasury_summary` | Returns current treasury balances, burn rate, runway | Treasury monitoring, answering questions |
| `get_treasury_transactions` | Returns recent treasury transactions with filters | Anomaly detection, question answering |
| `get_token_transfers` | Returns recent governance token movements | Attack detection |
| `get_wallet_profile` | Returns information about a wallet address (age, history, holdings) | Proposer risk assessment |
| `query_data` | Executes a read-only SQL query for ad-hoc data questions | Answering custom questions from chat |
| `send_group_message` | Sends a message to the Luffa DAO group | All capabilities |
| `send_direct_message` | Sends a DM to a specific member on Luffa | Vote nudging |
| `generate_chart` | Creates a chart image from data (bar, line, pie) | Treasury visualisation, voting stats |
| `get_knowledge` | Retrieves team corrections/definitions | Custom question answering |
| `store_knowledge` | Stores a new team correction/definition | Learning from chat |
| `log_action` | Records what the agent did and why (for dashboard + audit) | Every action |

### Agent Trigger System

| Trigger | Source | What Happens |
|---------|--------|-------------|
| New message in Luffa group mentioning @govmind | Luffa webhook | Agent processes the question/command and responds |
| New proposal detected | Scheduled check (every 5 min) or webhook | Agent summarises and posts to group |
| Vote deadline approaching | Scheduled check (hourly) | Agent evaluates participation and sends nudges if needed |
| Treasury change detected | Scheduled check (hourly) | Agent analyses the change and alerts if anomalous |
| Token flow anomaly | Scheduled check (every 15 min) | Agent analyses for governance attack patterns |

For the hackathon demo, scheduled triggers are replaced with manual triggers (API endpoints) so the demo can be choreographed reliably.

---

## 7. Dashboard Design

The dashboard serves two purposes:
1. **During demo:** Shows the audience what the agent is THINKING (the invisible magic made visible)
2. **In production:** Provides DAO administrators with an audit trail and observability into the AI governance operator

### Dashboard Layout (Three Panels)

**Left Panel: Live Feed**
- Real-time stream of Luffa group messages
- Colour-coded by type: user messages, agent responses, alerts
- Shows who's talking and when

**Center Panel: Agent Workspace**
- When the agent is active, shows step-by-step reasoning in real-time
- Each tool call appears as an animated card: "Fetching proposal #48 details..." → "Analysing proposer wallet..." → "Calculating treasury impact..." → "Generating summary..."
- Shows the actual data returned by each tool (tables, numbers)
- Shows the final message before it's sent to Luffa

**Right Panel: DAO Health Dashboard**
- Treasury overview (total value, allocation pie chart, runway)
- Active proposals with voting progress bars
- Member participation rate (percentage of members who voted in last 5 proposals)
- Governance health score (composite metric)
- Knowledge base (team corrections stored by the agent)
- Recent alerts timeline

### Dashboard Data Flow

The NestJS backend broadcasts agent activity over WebSocket to the Next.js dashboard. Every tool call, every reasoning step, every message sent is emitted as a WebSocket event. The dashboard renders these in real-time with animations.

This means during the demo, the audience sees the agent's brain working BEFORE the message appears in Luffa. That's the "wow" — watching the intelligence happen, not just seeing the output.

---

## 8. Demo Script (3 Minutes)

**Setup:** Projector shows the GovMind dashboard (full screen). Teammate has Luffa open on their phone (camera pointed at screen or mirrored).

### 0:00–0:20 — The Problem
"DAOs manage billions in crypto, but fewer than 10% of members actually vote on how that money is spent. Proposals pass with a handful of votes. Treasuries get drained by governance attacks. And the people who should be paying attention... aren't. Because governance proposals are long, technical, and nobody's summarising them."

### 0:20–0:50 — Proposal Intelligence (Autonomous)
"A new proposal just hit. Watch what GovMind does — nobody asked it to."

*Trigger the new proposal event. Dashboard lights up:*
- Agent detects new proposal (Step 1 animates)
- Reads full proposal text (Step 2)
- Analyses proposer wallet — age, history, holdings (Step 3)
- Calculates treasury impact (Step 4)
- Generates risk assessment (Step 5)
- Posts summary to Luffa (Step 6)

*Teammate shows Luffa on phone — the summary message has appeared in the group chat.*

"Nobody asked for this. The agent saw the proposal, understood it, assessed the risk, and briefed the team — all autonomously."

### 0:50–1:20 — Vote Mobilisation (Anti-Apathy)
"It's been 3 days. Only 8 of 47 members have voted on a 45 ETH proposal. Watch."

*Trigger the nudge cycle. Dashboard shows:*
- Agent checks voting status (17% participation)
- Decides this is below threshold
- Identifies 39 non-voters
- Generates personalised nudges based on each member's voting history
- Sends targeted DMs through Luffa

*Teammate shows their phone — a personalised nudge has arrived as a DM.*

"Each nudge is personalised. Alice gets reminded she voted against a similar proposal last month. Bob gets told his vote would swing the outcome. The agent decides who to nudge, when, and what to say."

### 1:20–1:50 — Treasury Question (Ad-Hoc)
*Teammate types in Luffa:* "@govmind what's our runway if this proposal passes?"

*Dashboard shows the agent reasoning in real-time:*
- Retrieves current treasury (142.3 ETH)
- Retrieves burn rate (23.1 ETH/month)
- Subtracts proposed allocation (45 ETH)
- Calculates new runway (97.3 / 23.1 = 4.2 months)
- Generates a burn-rate chart showing before/after
- Posts answer to Luffa

*Teammate shows the answer on phone — number + chart + context.*

"Anyone in the team can ask. No SQL. No blockchain explorer. Just ask in the group chat."

### 1:50–2:25 — Governance Attack Detection (Autonomous)
"Now watch this. Something suspicious is happening."

*Trigger the attack simulation. Dashboard shows:*
- Agent detects unusual token transfer pattern
- Three new wallets acquired large token positions in 24 hours
- All funded from the same source
- These wallets voted on a proposal requesting 80 ETH to an unknown address
- Agent classifies: CRITICAL RISK
- Posts alert to Luffa group with evidence

*Teammate shows the alert on phone.*

"A coordinated group is trying to drain the treasury. GovMind caught it because it's watching token flows, voting patterns, and wallet histories simultaneously. No human noticed. The agent did."

### 2:25–2:50 — The Dashboard (Technical Depth)
*Quick pan across the dashboard:*
"Everything the agent does is auditable. Every tool call, every decision, every message — logged and visible. Because when an AI has influence over your treasury, you need to see exactly what it's doing and why."

### 2:50–3:00 — Close
"GovMind turns governance from a chore into a conversation. It reads proposals so your members don't have to. It nudges voters so proposals reflect the community, not just the whales. It watches your treasury so nothing slips through. And it catches attacks before they succeed. All inside end-to-end encrypted Luffa — where your DAO already lives."

---

## 9. Judging Criteria Mapping

### AI Agents Track

| Criterion | How GovMind Delivers |
|-----------|---------------------|
| **Autonomy** | The agent proactively summarises proposals, nudges voters, monitors treasury, and detects attacks — all without being asked. It decides WHAT to do, WHEN to do it, and HOW to communicate based on the current state of the DAO. The demo shows 3 distinct autonomous actions. |
| **Usefulness** | Solves the #1 DAO killer (voter apathy) and the #3 DAO killer (governance attacks). Every DAO with >20 members needs this. The money at stake is real — billions in DAO treasuries. |
| **Technical Depth** | Single agent with 15 tools, autonomous decision-making across 4 capability domains, personalised nudging based on voting history analysis, anomaly detection over token flow patterns, persistent memory, error recovery, real-time dashboard with WebSocket observability. |
| **Creativity** | "AI governance operator" is a novel framing. Not a chatbot, not a dashboard, not a notification service — an autonomous operator that understands governance context and acts on it. The vote mobilisation system (personalised nudges based on voting history) is genuinely new. |

### LuffaNator Partner Challenge

| Success Metric | How GovMind Delivers |
|---------------|---------------------|
| "Automate tasks" | Automates proposal summarisation, vote tracking, treasury monitoring, anomaly detection |
| "Coordinate users" | Actively coordinates voter participation across DAO members with personalised outreach |
| "Interact on Luffa" | Native Luffa bot — all summaries, nudges, alerts, and answers delivered in Luffa chat |
| "Interact with external systems and large data sets" | Queries governance data, treasury transactions, token transfers, wallet histories |
| "Not simple chatbots" | Autonomous agent that acts proactively, not just reactively. Four integrated capabilities, not four separate bots. |

### LuffaNation Partner Challenge (Stretch)

| Criterion | How GovMind Delivers |
|-----------|---------------------|
| Integration (blockchain essential?) | The entire product is about blockchain governance — proposals, votes, treasury, and token flows are all on-chain data. Without blockchain, this product doesn't exist. |
| Technical execution (works on-chain?) | Reads from on-chain data (mocked for demo, but architecture is production-ready). Wallet actions route through Luffa's Endless chain wallet. |
| Innovation | AI-powered governance operator that fights voter apathy — this doesn't exist yet. |
| Practicality | Could become a real product. Every DAO with a treasury needs this. |

---

## 10. Build Plan (3 Days)

### Friday Evening (Day 1, ~5 hours) — Foundation

**Builder:**
- NestJS project scaffolding with PostgreSQL + TypeORM
- Database migrations for all tables (governance data + agent state)
- Seed script: create a realistic DAO dataset (50 members, 10 proposals with voting history, 6 months of treasury transactions, token transfers including one attack pattern)
- Luffa bot account setup at robot.luffa.im
- Basic webhook endpoint receiving Luffa messages
- Core agent scaffolding: Claude tool-calling setup with 3-4 initial tools

**Product Person:**
- Research Luffa bot API docs thoroughly at robot.luffa.im/docManagement/operationGuide
- Design the seed data story (what DAO? what treasury? what proposals?)
- Draft pitch deck structure
- Set up GitHub repo with README

### Saturday (Day 2, ~12 hours) — Core Agent + Dashboard

**Builder (Morning):**
- Complete all 15 agent tools (database query functions)
- Implement the agent trigger system (webhook handler + manual trigger endpoints)
- Implement Proposal Intelligence capability (new proposal → summary → post to Luffa)
- Implement Treasury Health capability (treasury summary tool + chart generation)

**Builder (Afternoon):**
- Implement Vote Mobilisation capability (check participation → generate nudges → send DMs)
- Implement Attack Detection capability (token flow analysis → alert generation)
- Begin Next.js dashboard: WebSocket connection, live feed panel

**Product Person (All Day):**
- Write demo script with exact timing
- Prepare the "choreography" — which triggers fire in what order during the 3-min demo
- Create manual trigger endpoints list (so demo can be reliably controlled)
- Flesh out pitch deck with wireframes and problem/solution slides
- Test Luffa bot messaging (send test messages, verify webhooks work)

### Sunday (Day 3, ~8 hours) — Dashboard + Demo Hardening

**Builder (Morning):**
- Complete dashboard: agent workspace panel (real-time tool call visualisation), DAO health panel
- WebSocket event emission from every agent action
- Dashboard animations (steps appearing sequentially as agent thinks)

**Builder (Afternoon):**
- Full demo run-through with all 4 capabilities
- Bug fixes and edge case handling
- Record demo video (screen recording of dashboard + Luffa side by side)
- Clean up GitHub repo, add architecture diagram to README

**Product Person:**
- Finalize pitch deck
- Practice the 3-minute narration against the demo
- Record and edit demo video
- Submit to AI Agents track + LuffaNator + LuffaNation (if wallet integration done)
- LuffaMedia social media posts (#luffahackathon, tag @luffaapp)

---

## 11. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Luffa bot API is underdocumented or unreliable | Medium | High | Build the agent logic completely independent of Luffa. Have a fallback: the dashboard itself can serve as the demo surface, showing the agent working + the Luffa messages it WOULD send. Worst case: demo from dashboard only, explain Luffa integration in pitch. |
| Dashboard isn't ready in time | Medium | Medium | The dashboard is demo polish, not core functionality. If it's not ready, demo from Luffa chat directly (less impressive but still works). Prioritise the agent logic over dashboard visuals. |
| Claude tool-calling is flaky during demo | Low | High | Pre-test every tool call in the demo sequence. Have the seed data designed so queries are unambiguous. Keep a recording of a successful run as backup. |
| Seed data doesn't tell a compelling story | Medium | Medium | Product person owns the data story. Create a narrative: "MetaDAO" with a history of proposals, a healthy treasury that's getting attacked, and voter apathy that GovMind is fighting. Test the story with the demo script before building. |
| Scope creep — trying to build wallet integration | Medium | Medium | Wallet integration is a stretch goal ONLY. Do not touch it until all 4 core capabilities work end-to-end with the dashboard. If Saturday midnight arrives and wallet isn't started, skip it. |
| Another team builds a governance tool | Low | Medium | The personalised vote nudging + attack detection combo is novel. Even if someone builds a "DAO governance bot," they won't have the anti-apathy engine with voting history analysis. That's the differentiator. |

---

## 12. What Success Looks Like

**Minimum Viable Demo (must have):**
- Agent autonomously summarises a new proposal and posts to Luffa
- Agent answers an ad-hoc treasury question from chat
- Agent sends at least one personalised vote nudge
- Dashboard shows agent reasoning for at least one action in real-time

**Strong Demo (should have):**
- All 4 capabilities demonstrated in the 3-minute demo
- Dashboard shows real-time animated reasoning for every action
- Governance attack detection fires with convincing evidence
- Charts render correctly in both dashboard and Luffa

**Outstanding Demo (nice to have):**
- Wallet action from Luffa (vote or transfer)
- Team Memory correction demonstrated
- Audience member can type a question in Luffa and get a live answer
- Dashboard has polished UI with DAO health score
