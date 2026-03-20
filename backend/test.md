# GovMind Bot Testing Guide

## How to Test

There are two ways to trigger the bot:

**From Luffa (reactive):** Type a message in the group chat or DM the bot directly.

**From terminal (proactive triggers):** Use curl to hit the trigger endpoints.

---

## Proactive Triggers (curl commands)

### 1. Treasury Health Check
```bash
curl -X POST http://localhost:3001/trigger/treasury-check
```
Expected: Bot posts a treasury alert to the group mentioning 82% concentration in GOV token, burn rate, runway, and diversification recommendation.

### 2. New Proposal Summary (Proposal #48 — Marketing Sprint)
```bash
curl -X POST http://localhost:3001/trigger/new-proposal
```
Expected: Bot analyses proposal #48 (45 ETH marketing spend), checks proposer wallet, calculates treasury impact (142 ETH -> 97 ETH), and posts a summary with MEDIUM risk rating.

### 3. New Proposal Summary (Proposal #49 — The Attack Proposal)
```bash
curl -X POST http://localhost:3001/trigger/new-proposal -H "Content-Type: application/json" -d '{"proposal_number": 49}'
```
Expected: Bot analyses proposal #49 (80 ETH to unknown wallet), flags the unknown proposer, and posts a HIGH/CRITICAL risk warning.

### 4. Vote Participation Check + Nudges
```bash
curl -X POST http://localhost:3001/trigger/vote-check
```
Expected: Bot checks active proposals, finds proposal #48 has only 17% participation, sends a group reminder, and attempts DMs to members with luffa_user_ids.

### 5. Governance Attack Detection
```bash
curl -X POST http://localhost:3001/trigger/attack-check
```
Expected: Bot scans token transfers, discovers 3 wallets acquired 12,000 GOV from same source in 24h, cross-references with proposal #49's suspicious votes, and posts a GOVERNANCE ALERT.

### 6. Ad-Hoc Question (via curl)
```bash
curl -X POST http://localhost:3001/trigger/ask -H "Content-Type: application/json" -d '{"question": "What is our current runway?"}'
```
Expected: Bot queries treasury, calculates runway, and posts the answer.

---

## Reactive Tests (type these in Luffa group chat)

### Treasury Questions
- What's our treasury balance?
- How much runway do we have?
- What's our burn rate this month?
- What's our runway if proposal 48 passes?
- How much have we spent on contributor payments in the last 3 months?
- What percentage of our treasury is in stablecoins?
- Show me our top 5 largest outflows

### Proposal Questions
- What proposals are currently active?
- Summarise proposal 48
- Who proposed the marketing sprint?
- How much does proposal 48 cost as a percentage of our treasury?
- What's the risk level on proposal 49?
- Compare proposal 48 and 49

### Voting Questions
- How many people have voted on proposal 48?
- Who hasn't voted on proposal 48 yet?
- What's Alice Chen's voting history?
- What's the participation rate across our last 5 proposals?
- Which members have the highest voting participation?

### Governance Security Questions
- Are there any suspicious token movements?
- Who submitted proposal 49 and what do we know about their wallet?
- Have any new wallets acquired large token positions recently?
- Is there any coordinated voting happening?

### Knowledge / Corrections
- Actually, our runway calculation should exclude the locked staking positions
- The correct burn rate should use a 60-day rolling average, not 30-day
- When you say "core contributor" that means Alice, Bob, and Carol only
- Our target runway is 8 months minimum

Then test retrieval:
- What's our runway? (should now mention the staking exclusion correction)
- Who are the core contributors? (should reference the correction)

### Edge Cases
- (empty message — should be ignored)
- What is the mass of the sun? (off-topic — bot should stay in governance lane)
- DROP TABLE proposals; (SQL injection attempt — should be rejected by query_data)
- Summarise proposal 999 (non-existent proposal — should handle gracefully)

---

## DM Tests (send these as direct messages to the bot)

- What proposals are active right now?
- What's our treasury balance?
- Have I voted on proposal 48? (bot won't know who "I" am without mapping, but should handle gracefully)

---

## Demo Sequence (3-minute run-through)

Run these in order with ~30 seconds between each:

```bash
# 1. Proposal Intelligence
curl -X POST http://localhost:3001/trigger/new-proposal

# 2. Vote Mobilisation (wait 30s)
curl -X POST http://localhost:3001/trigger/vote-check

# 3. Treasury Question (wait 30s — or type this in Luffa)
curl -X POST http://localhost:3001/trigger/ask -H "Content-Type: application/json" -d '{"question": "What is our runway if proposal 48 passes?"}'

# 4. Governance Attack (wait 30s)
curl -X POST http://localhost:3001/trigger/attack-check
```

---

## What to Watch For

| Signal | Healthy | Problem |
|--------|---------|---------|
| Response time | 5-15 seconds | >30 seconds = timeout, check Anthropic API |
| Group message appears | Within 2s of agent completing | Missing = wrong group ID or Luffa API error |
| Tool calls in server logs | Each step logged with tool name | No logs = agent not running |
| DM delivery | Arrives in bot DM chat | Missing = wrong luffa_user_id |
| Chart generation | File created in public/charts/ | Error = canvas dependency issue |
| Knowledge stored | Subsequent queries reference it | Missing = knowledge lookup not triggered |
| Attack detection | Finds 3 wallets + same source | Missing = token_transfers not seeded or wrong time window |

## Diagnostic Endpoint

```bash
# See raw messages from Luffa (useful for debugging)
curl http://localhost:3001/trigger/poll-test | python3 -m json.tool
```
