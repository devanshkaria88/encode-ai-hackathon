# Luffa Platform Developer Skill

## Overview

Luffa is a next-generation encrypted social messaging platform built on the Endless blockchain protocol. It features end-to-end encryption (E2EE) using a hybrid RSA/AES architecture, a built-in Web3 wallet supporting multiple chains (Endless, Bitcoin, Ethereum, BSC, TRON), and a bot development platform for building automated agents.

Luffa is comparable to Telegram or Signal but with deep Web3/blockchain integration: token-gated groups, on-chain group governance via multi-sig wallets, NFT minting, Web3 airdrops, a Visa-partnered crypto payment card (Luffa Card), and a mini app framework called SuperBox.

**Key URLs:**
- Main site: https://www.luffa.im/
- Developer Zone: https://www.luffa.im/developer/ (landing page for Bots, SuperBox, Service Accounts)
- User guide: https://userguide.luffa.im/
- Bot management portal: https://robot.luffa.im/
- Bot API base URL: `https://apibot.luffa.im/robot`
- Python SDK: https://github.com/sabma-labs/luffa-bot-python-sdk
- SuperBox (mini apps) docs: https://luffa.im/SuperBox/docs/en/quickStartGuide/quickStartGuide.html
- SuperBox registration: https://super.luffa.im/superbox/team-register/
- Service Account portal: https://www.luffa.im/developer/service
- Endless chain docs: https://docs.endless.link/

---

## Bot Development

### Creating a Bot

1. **Install Luffa app** on your mobile device (iOS/Android).
2. **Create a Luffa account** using a mnemonic phrase (no email/phone required).
3. **Navigate to the Bot Developer Portal**: https://robot.luffa.im/login
4. **Scan the QR code** with your Luffa app to log in.
5. **Click "New Bot"** to automatically generate a robot. Each user can create up to 5 bots.
6. **Note your bot credentials**:
   - **Robot Name**: Synced with the Luffa display name
   - **UID**: The bot's Luffa user ID
   - **SecretKey**: Used for API authentication (receiving and sending messages)
7. **Customize the bot**:
   - Change name: Editable in the portal, synced to Luffa
   - Change profile picture: Log into Luffa with the bot's mnemonic phrase, then update the avatar
   - Quick Chat commands: Add up to 10 predefined command buttons that appear when users interact with the bot

**Source:** https://robot.luffa.im/docManagement/operationGuide

### Bot Architecture: Polling, Not Webhooks

**Critical note:** Luffa bots use a **polling model**, NOT webhooks. Your bot server must poll the Luffa API at regular intervals to receive new messages. This is fundamentally different from Telegram/Discord-style webhook bots.

The official Python SDK abstracts this with a `run()` loop that polls every N seconds with built-in deduplication.

### Bot API Reference

#### API Base URL

```
https://apibot.luffa.im/robot
```

All endpoints accept POST requests with JSON bodies. Authentication is via the `secret` field in every request body.

#### Authentication

Bots authenticate using their **SecretKey** (obtained from the robot management portal). The secret is sent as a field in every API request body — there are no headers or OAuth flows.

```python
# Set via code
import luffa_bot
luffa_bot.robot_key = "YOUR_ROBOT_SECRET"

# Or via environment variable
# export LUFFA_ROBOT_SECRET="YOUR_ROBOT_SECRET"
```

#### Receiving Messages (Polling)

**Endpoint:** `POST https://apibot.luffa.im/robot/receive`

**Request body:**
```json
{
  "secret": "YOUR_ROBOT_SECRET"
}
```

**Response format:**
```json
[
  {
    "uid": "user-or-group-id",
    "count": 1,
    "type": 0,
    "message": [
      "{\"atList\":[],\"text\":\"hello\",\"urlLink\":null,\"msgId\":\"m1\"}"
    ]
  }
]
```

**Response fields:**
| Field | Type | Description |
|-------|------|-------------|
| `uid` | string | User ID (for DMs) or Group ID (for group messages) |
| `count` | int | Number of messages in this envelope |
| `type` | int | `0` = direct message (single chat), `1` = group message |
| `message` | array | Array of JSON-encoded message strings |

**Each message object (after JSON parsing):**
| Field | Type | Description |
|-------|------|-------------|
| `text` | string | The message text content |
| `atList` | array | List of @mentioned users |
| `urlLink` | string/null | Any URL link in the message |
| `msgId` | string | Unique message identifier (used for deduplication) |
| `uid` | string/null | Sender's user ID (present in group messages) |

**Important notes:**
- Messages in the `message` array are JSON **strings** (double-encoded). You must `JSON.parse()` each one.
- The API sometimes wraps the response in `{"data": [...]}` — check for both formats.
- Messages may use alternative field names: `msg`, `content`, or `message` instead of `text`.
- Poll at ~1 second intervals for responsive bots.

#### Sending Messages to Users (DMs)

**Endpoint:** `POST https://apibot.luffa.im/robot/send`

**Request body:**
```json
{
  "secret": "YOUR_ROBOT_SECRET",
  "uid": "TARGET_USER_ID",
  "msg": "{\"text\":\"Hello from the bot!\"}"
}
```

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `secret` | string | Bot's secret key |
| `uid` | string | Target user's ID |
| `msg` | string | JSON-encoded message object with `text` field |

**Note:** The `msg` field is a **JSON-encoded string**, not a raw object. You must `JSON.stringify()` the message payload.

#### Sending Messages to Groups

**Endpoint:** `POST https://apibot.luffa.im/robot/sendGroup`

**Request body (text only, type=1):**
```json
{
  "secret": "YOUR_ROBOT_SECRET",
  "uid": "TARGET_GROUP_ID",
  "msg": "{\"text\":\"Hello group!\"}",
  "type": "1"
}
```

**Request body (with buttons, type=2):**
```json
{
  "secret": "YOUR_ROBOT_SECRET",
  "uid": "TARGET_GROUP_ID",
  "msg": "{\"text\":\"Pick an option:\",\"button\":[{\"name\":\"OK\",\"selector\":\"ok\",\"isHidden\":0},{\"name\":\"More\",\"selector\":\"more\",\"isHidden\":0}]}",
  "type": "2"
}
```

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `secret` | string | Bot's secret key |
| `uid` | string | Target group's ID |
| `msg` | string | JSON-encoded message payload |
| `type` | string | `"1"` = text only, `"2"` = advanced (buttons/interactive) |

**Note:** The `type` field is a **string**, not an integer.

#### Message Types

**1. Plain text (message_type=1):**
```json
{"text": "Your message here"}
```

**2. Text with buttons (message_type=2):**
```json
{
  "text": "Pick an option:",
  "button": [
    {"name": "OK", "selector": "ok", "isHidden": 0},
    {"name": "Cancel", "selector": "cancel", "isHidden": 0}
  ]
}
```

**3. Text with confirm buttons (message_type=2):**
```json
{
  "text": "Are you sure?",
  "confirm": [
    {"name": "Yes", "selector": "yes", "type": "default", "isHidden": 0},
    {"name": "No", "selector": "no", "type": "destructive", "isHidden": 0}
  ]
}
```
Note: `confirm` and `button` are mutually exclusive — only one can be set per message.

**4. Text with @mentions:**
```json
{
  "text": "Hey @Alice check this out",
  "atList": [
    {
      "name": "Alice",
      "did": "USER_DID",
      "length": 6,
      "location": 4,
      "userType": 0
    }
  ]
}
```

**5. Text with URL link:**
```json
{
  "text": "Check this link",
  "urlLink": "https://example.com"
}
```

#### Sending Images

**PARTIALLY DOCUMENTED.** The Luffa user guide's [Key Features of Bots](https://userguide.luffa.im/bot/key-features-of-bots) page explicitly states bots support "Rich Message Formats" including "text with **images**, interactive buttons, **cards**, and external links." This confirms the platform supports image messages from bots.

However, the Python SDK (`luffa-bot-python-sdk`) does NOT implement image sending. The `msg` payload structure in the SDK only covers text, buttons, confirms, @mentions, and URL links. This means:

1. **Image sending IS possible** at the platform level — the API likely supports it
2. **The SDK doesn't implement it** — the `msg` field probably accepts undocumented image-related fields
3. **Cards are also supported** — another undocumented message type that could be useful for rich display

**Possible approaches for GovMind:**
1. Send a URL link pointing to a hosted chart image (using `urlLink` field) — guaranteed to work
2. Experiment with the `msg` payload to discover image fields (e.g., `image`, `imageUrl`, `pic`, `mediaUrl`) — may work but untested
3. Ask the SDK author (niraj.kulkarni@luffa.im) or the Luffa hackathon channel for the image payload format
4. Check if the Service Account API (which explicitly supports "text, images, audio and video, and graphic content") has documented image formats that also work for bots

**Recommendation:** Start with URL links as the safe path. Test image payload fields early Saturday. Ask in the hackathon channel for the image message format.

#### Bot Commands (Quick Chat)

Bot commands are configured through the robot management portal (not via API):
- Navigate to your bot in https://robot.luffa.im/
- Add "Quick Chat" items (up to 10)
- Each command has:
  - **Command Icon**: Optional custom icon
  - **Chat Content**: The text sent when the command is selected
  - **Sorting**: Display order in the UI
- When users open a chat with the bot, they see these as quick action buttons
- In group chats, users can @mention the bot and select a quick command

#### Bot in Groups

- Bots can be added to groups like normal users.
- Bots receive group messages when polled (envelope `type=1`).
- Bots can send messages to groups using `sendGroup`.
- Users can @mention bots in groups; the bot receives the mention in `atList`.
- The bot is treated as a normal Luffa user — it has its own UID, mnemonic, and wallet.
- Bots can respond to button selections (the `selector` value comes back as a regular text message).

### Bot Limitations

- **No webhooks**: Must poll for messages (adds latency vs. push-based systems)
- **No native image sending**: No documented API for sending images directly
- **No file uploads**: No documented upload endpoint
- **Max 5 bots per user**: Account-level limit
- **Max 10 quick chat commands**: Per bot limit
- **No documented rate limits**: The API docs don't specify rate limits, but the SDK defaults to 1-second polling intervals, suggesting this is a safe frequency
- **No documented error codes**: No structured error code reference
- **Polling-only architecture**: The bot must continuously run a process to check for new messages
- **No webhook verification needed**: Since there are no webhooks, there's nothing to verify (simplifies security)
- **E2EE implications**: All messages between the bot and users are end-to-end encrypted — only the bot and the user/group can see message content. The platform cannot read messages.

---

## Python SDK Reference

### Installation

```bash
pip install luffa-bot-python-sdk
```

Requires Python 3.9+. Latest version: **0.1.2** (2026-03-10). Dependencies: `httpx>=0.27`, `typing-extensions`.

### Quick Start

```python
import asyncio
import luffa_bot

luffa_bot.robot_key = "YOUR_ROBOT_SECRET"

async def handler(msg, env, client):
    if env.type == 0:  # DM
        await client.send_to_user(env.uid, f"You said: {msg.text}")
    else:  # Group
        await client.send_to_group(env.uid, f"Received: {msg.text}")

asyncio.run(luffa_bot.run(handler, interval=1.0, concurrency=5))
```

### SDK API Methods

| Method | Description |
|--------|-------------|
| `luffa_bot.receive()` | Poll once for messages, returns `List[IncomingEnvelope]` |
| `luffa_bot.send_to_user(uid, payload)` | Send DM to a user |
| `luffa_bot.send_to_group(uid, payload, message_type=1)` | Send message to a group |
| `luffa_bot.run(handler, interval, concurrency, ...)` | Continuous polling loop |

### Data Models

```python
# Incoming
@dataclass
class IncomingMessage:
    atList: List[Dict[str, Any]]
    text: str
    urlLink: Optional[str]
    msgId: str
    uid: Optional[str] = None  # sender ID in group messages

@dataclass
class IncomingEnvelope:
    uid: str        # user or group ID
    count: int
    messages: List[IncomingMessage]
    type: Literal[0, 1]  # 0=DM, 1=group

# Outgoing
@dataclass
class TextMessagePayload:
    text: str
    atList: Optional[List[Dict[str, Any]]] = None

@dataclass
class GroupMessagePayload(TextMessagePayload):
    confirm: Optional[List[ConfirmButton]] = None
    button: Optional[List[SimpleButton]] = None
    dismissType: Optional[Literal["select", "dismiss"]] = None

@dataclass
class SimpleButton:
    name: str
    selector: str
    isHidden: Literal[0, 1] = 0

@dataclass
class ConfirmButton:
    name: str
    selector: str
    type: Literal["destructive", "default"] = "default"
    isHidden: Literal[0, 1] = 0

@dataclass
class AtMention:
    name: str
    did: str
    length: int
    location: int
    userType: Literal[0] = 0
```

### Run Loop Features

```python
await luffa_bot.run(
    handler=my_handler,      # async function(msg, env, client)
    interval=1.0,            # polling interval in seconds
    concurrency=5,           # max concurrent handlers
    middleware=[log_mw],      # optional middleware pipeline
    on_error=error_handler,   # optional async error callback
    dedupe=True,             # drop duplicate msgIds (default True)
    max_seen_ids=10_000,     # dedupe memory cap
)
```

### CLI Commands

```bash
export LUFFA_ROBOT_SECRET="..."

# Run an echo bot
luffa-bot run --interval 1.0

# Send a DM
luffa-bot send --uid <USER_ID> --text "Hello"

# Send group message with buttons
luffa-bot send-group --uid <GROUP_ID> --text "Hi group" --with-buttons
```

---

## Adapting for Node.js / NestJS

The Python SDK is the only official SDK. For a NestJS backend (like GovMind), you need to **port the API calls to TypeScript/Node.js**. Here is the direct HTTP approach:

### TypeScript Implementation Pattern

```typescript
import axios from 'axios';

const BASE_URL = 'https://apibot.luffa.im/robot';

interface LuffaConfig {
  secret: string;
}

// Receive messages (poll)
async function receive(config: LuffaConfig) {
  const resp = await axios.post(`${BASE_URL}/receive`, {
    secret: config.secret,
  });
  let data = resp.data;
  if (data?.data) data = data.data;
  return data.map(parseEnvelope);
}

// Send DM
async function sendToUser(config: LuffaConfig, uid: string, text: string) {
  await axios.post(`${BASE_URL}/send`, {
    secret: config.secret,
    uid,
    msg: JSON.stringify({ text }),
  });
}

// Send group message
async function sendToGroup(
  config: LuffaConfig,
  uid: string,
  payload: string | object,
  messageType: number = 1,
) {
  const msg = typeof payload === 'string'
    ? JSON.stringify({ text: payload })
    : JSON.stringify(payload);

  await axios.post(`${BASE_URL}/sendGroup`, {
    secret: config.secret,
    uid,
    msg,
    type: String(messageType),
  });
}

// Parse an envelope from the receive response
function parseEnvelope(item: any) {
  const messages = (item.message || []).map((raw: any) => {
    const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return {
      text: obj.text || obj.msg || obj.content || '',
      msgId: obj.msgId || obj.mid || '',
      atList: obj.atList || [],
      urlLink: obj.urlLink || null,
      uid: obj.uid || null,
    };
  });
  return {
    uid: String(item.uid),
    count: Number(item.count || 0),
    type: Number(item.type || 0),  // 0=DM, 1=group
    messages,
  };
}
```

**Key gotchas when porting:**
1. The `msg` field must be a JSON **string** (double-encoded), not an object
2. The `type` field in sendGroup must be a **string** (`"1"` or `"2"`), not a number
3. Messages in the receive response may be JSON strings that need parsing
4. The response may be wrapped in `{"data": [...]}` — handle both formats
5. Message text may appear in `text`, `msg`, `content`, or `message` fields

---

## Mini App Development (SuperBox)

### SuperBox IS the Mini App Framework

SuperBox is Luffa's mini app platform — functionally equivalent to **WeChat Mini Programs**. It allows developers to build lightweight apps that run inside the Luffa app without installation. SuperBox has comprehensive documentation, a dedicated IDE, and a full development framework.

**Key facts:**
- **Technology stack**: WXML (templates), WXSS (styles), JavaScript — identical to WeChat Mini Programs
- **Dedicated IDE**: "Luffa Cloud-Devtools" — downloadable desktop application for code editing, debugging, previewing, and publishing
- **Full documentation**: https://luffa.im/SuperBox/docs/en/quickStartGuide/quickStartGuide.html
- **Registration required**: Developers must register as a team (team manager + members) at https://super.luffa.im/
- **Review process**: Apps must be submitted for review before publishing
- **Contact**: superbox-Cs@Luffa.im

### SuperBox Documentation Scope

The documentation covers:
- **Quick Start Guide**: Account registration, creating an applet, uploading, and audit/release
- **Mini Program Development Guide**: Introduction, JSON/WXML/WXSS/JS configuration, host environment, operating mechanism, code structure, directory structure
- **Framework**: Global/page configuration, framework interfaces (App, Page, Custom Components), WXML syntax (data binding, list rendering, conditional rendering, templates), WXS syntax
- **Components**: View containers, basic content, map, media, open capabilities, canvas, navigation, form components
- **API**: Basics, routing, jumping, forwarding, UI interfaces (window, font, interaction, nav bar, background, tab bar, pull-to-refresh, scroll, animation), network (UDP, TCP, mDNS, HTTP requests, upload, WebSocket, download), data cache, canvas, worker, media (rich text, video, audio, camera, image), WXML, file system, device APIs (contacts, vibration, battery, screen, memory, orientation, accessibility, network, keyboard, phone, accelerometer, compass, gyroscope, SMS, scan code, encryption, NFC, WiFi, calendar, clipboard, Bluetooth), location, open interface, custom API, sensitive API, H5 real-time communication
- **JS SDK**: WebView, interface description
- **IDE Guide**: Overview, interface, settings, code editing, debugging, other notes
- **Small Game Development Guide**: Engine adaptation, runtime, rendering, permissions, game interaction

### SuperBox vs Bot for GovMind

| Factor | SuperBox (Mini App) | Bot |
|--------|-------------------|-----|
| Setup time | Days (registration, review, IDE setup) | Hours (create bot, get secret key) |
| Technology | WXML/WXSS/JS (WeChat-like) | Any backend language |
| Review process | Required before publishing | None |
| Real-time messaging | Not native (it's an app, not a chat participant) | Native (receives and sends chat messages) |
| Rich UI | Full UI framework with components | Text + buttons only |
| Hackathon fit | Poor — too much setup overhead, review delays | Good — immediate API access |

**For GovMind: Bots are the right choice.** SuperBox is a full mini app framework that would take too long to set up for a 48-hour hackathon, requires a review process, and doesn't naturally fit the "AI agent in a group chat" use case.

### Service Accounts

Service Accounts are a broadcasting/notification system for creators and projects. Key details from the [Developer Zone](https://www.luffa.im/developer/service):

- **Capabilities**: Group text, images, audio/video, graphic content push; smart auto-replies (keyword triggers, follow-up welcome, AI-powered); tag-based targeted notifications; native payment access (tips, order payments, subscriptions); open interfaces for messaging, user management, and customer service
- **Setup**: Scan QR code with Luffa at https://www.luffa.im/developer/service
- **Can link to Bots**: Service Accounts can be linked to Bots, Groups, Channels, and SuperBox apps for integrated functionality
- **Keyword replies**: Full match and partial match triggers with customizable responses
- **Menu system**: Custom navigation menus with main menus and sub-menus
- **Broadcast messaging**: Send to all subscribers at once

**Service Account messaging constraints:**
- Service Accounts CANNOT proactively message followers unless:
  - It's an automatic welcome message on first follow
  - The user initiates a conversation (then the Service Account can respond for up to 7 days)
- All Service Account profiles and published content are publicly accessible and searchable

**For GovMind**: Service Accounts could be useful alongside the bot for broadcasting DAO alerts to subscribers, but the bot API is the primary integration path for interactive conversations. The 7-day response window constraint would also limit Service Account usefulness for ad-hoc interactions.

---

## Wallet & Blockchain Integration

### Luffa Wallet Overview

The Luffa Web3 Wallet is built into the Luffa app and supports:
- **Endless chain** (native chain, built on Move language)
- **Ethereum (ETH)**
- **BNB Smart Chain (BSC)**
- **TRON**
- **Bitcoin** (via mnemonic-based multi-chain support)
- Derived accounts (multiple wallets from one mnemonic)
- NFT minting and display (Endless chain only for minting; multi-chain display)
- Cross-chain transfers (from Endless to other supported chains)
- Web3 airdrop distribution and claiming (via smart contracts on Endless)
- Risk interaction alerts for suspicious contracts
- On-chain activity notifications (token/NFT receipts, airdrop claims, approval changes)

Source: [Supported Networks and Assets](https://userguide.luffa.im/wallet/supported-networks-and-assets)

### Bot-Wallet Interaction

**NOT SUPPORTED via API.** There is no documented way for a bot to:
- Read a user's wallet balance
- Trigger wallet transactions
- Request payment confirmations
- Interact with the wallet in any way through the bot API

The bot API only supports messaging (text, buttons, @mentions). The wallet is a user-side feature within the Luffa app.

**Bots ARE Luffa users**, meaning each bot has its own wallet (generated from its mnemonic). However, this wallet is only accessible by logging into the Luffa app with the bot's mnemonic — not programmatically through the bot API.

### Endless Chain

Endless is the blockchain protocol underlying Luffa. Key facts:
- **Smart contract language**: Move (similar to Aptos/Sui)
- **Documentation**: https://docs.endless.link/
- **SDKs**: TypeScript, Rust, Go
- **Features**: Fungible assets, NFTs (digital assets), multi-sig wallets
- **Developer tools**: CLI (`endless` command), VS Code extension
- **Networks**: Devnet, testnet, mainnet

**Luffa-specific blockchain features:**
- **Web3 Groups**: On-chain community with a shared public account governed by multi-sig wallets. Any transaction requires approval from multiple signatories.
- **Token-gated access**: Groups can require token ownership for membership.
- **Airdrops**: Built-in airdrop system for distributing tokens.

**For GovMind**: Endless chain integration is irrelevant for the hackathon. All DAO data will be mocked in PostgreSQL. The blockchain layer is not needed.

---

## OpenClaw Integration

### Status: No Confirmed Luffa Channel Support

OpenClaw is an AI agent gateway supporting multiple messaging platforms (WhatsApp, Telegram, Discord, Slack, Signal). However:

- **No evidence** that OpenClaw supports Luffa as a channel
- Search results show no Luffa-specific integration documentation on OpenClaw's side
- No tweets from @LuffaMessage about OpenClaw were found in search results
- The Luffa bot API uses a polling model, which is non-standard for OpenClaw's webhook-based channel architecture

**Recommendation**: Do not pursue the OpenClaw path. Build directly against the Luffa bot API.

---

## Groups and Channels

### Web3 Groups

- On-chain communities registered on the Endless protocol
- Each group has a unique blockchain-native identifier
- Groups include a shared public account that can receive asset donations
- Group accounts are governed by multi-sig wallets
- Transactions require approval from multiple wallet signatories
- Support larger member counts than traditional groups
- **Group-owned assets (coming soon)**: Web3 groups will be able to hold and manage their own on-chain assets — tokens, NFTs, airdrop eligibility — enabling DAO governance, member rewards, and event funding
- **Explicitly designed for DAO governance**: The user guide states Web3 groups are "designed to evolve from decentralized coordination to fully autonomous DAO governance" — directly relevant to GovMind's use case
- All group account activity is recorded on-chain for full transparency and auditability
- Two group types: Regular Group (off-chain) and On-Chain Group (registered on Endless chain with expiration period)
- Groups support in-chat wallet transfers between members

### Standard Groups

- Created through the Luffa mobile app
- Support text, images, audio, video, files, and voice messages
- Features: auto-delete messages, AI translation, admin management, group links/QR codes
- Bots can be added to groups and receive/send messages via API

### Channels

- One-way broadcasting channels (publisher → subscribers) with subscriber likes/comments
- Can link to multiple discussion groups for "public-to-private" traffic funneling
- Can link to SuperBox (mini apps) for integrated experiences
- Support articles, videos, and other content formats
- Channel categories with recommended placement for exposure
- Not suitable for bot-as-participant integration, but a bot could post through a linked Service Account

### Luffa Airdrops (On-Chain)

- On-chain airdrop feature via smart contracts on Endless
- Modes: Fixed (equal distribution), Lucky (random amounts), Exclusive (specific recipients)
- Can be shared in group chats or sent peer-to-peer
- Gas-free claiming option (sender covers gas)
- Tokens must be deployed on Endless blockchain
- 24-hour expiry; unclaimed portions can be reclaimed
- Supported tokens: EDS, USDT, and partner project tokens

### In-Chat Wallet Transfers

- Users can transfer funds directly within a conversation via "More" > "Transfer"
- This is a user-initiated action within the Luffa app, not available via bot API

---

## Gaps and Unknowns

### Critical Gaps

1. **Image sending API undocumented in SDK**: The user guide confirms bots support "text with images, interactive buttons, cards, and external links" ([Key Features of Bots](https://userguide.luffa.im/bot/key-features-of-bots)), but the Python SDK does not implement image sending. The exact `msg` payload format for images is unknown. The Service Account API also mentions image support but without API-level documentation.

2. **No Development Guide content**: The page at `https://robot.luffa.im/docManagement/developmentGuide` exists but shows no content even when logged in. The "development documentation" referenced in the Operation Guide may not exist yet, or may only be accessible to certain accounts.

3. **No webhook/push mechanism**: Bots must poll every 1-2 seconds. This adds latency compared to webhook-based platforms and requires a continuously running process.

4. **No message formatting**: No evidence of markdown, HTML, or rich text support in bot messages. Messages appear to be plain text only (plus buttons/confirms).

5. **No message history API**: No endpoint to retrieve conversation history. The bot can only receive messages it polls during its runtime.

6. **No typing indicators or read receipts**: No API for indicating the bot is processing.

### Moderate Gaps

7. **No group member list API**: Cannot retrieve the list of members in a group.
8. **No user profile API**: Cannot look up a user's display name or other profile info.
9. **No rate limit documentation**: Unknown what happens if you send too many messages.
10. **No error code reference**: API errors are generic HTTP status codes.
11. **Service Account API**: Mentioned in user guide as having "Open API Access" but no documentation found.

### Pages That Were Inaccessible or Empty

- `https://robot.luffa.im/docManagement/developmentGuide` — Renders empty despite being logged in. The sidebar shows "Development Guide" as a section header but no content loads. This is the page the Operation Guide refers users to for API documentation, but it appears to not be built yet.
- `https://robot.luffa.im/docManagement/userGuide` — Renders empty
- `https://www.luffa.im/developer/bot` — Redirects to developer home page, no bot-specific content
- `https://www.luffa.im/developer/superbox` — Redirects to developer home page (but https://luffa.im/SuperBox/ works)
- `https://callup.luffa.im/c/LSEGpNDNioX` — Hackathon channel (requires Luffa app, not accessible via browser)

### Questions a Developer Would Need Answered

1. **What is the `msg` payload format for sending images?** The user guide confirms image support exists. Is it a base64 field? A URL field? An upload-then-reference flow?
2. **What is the `msg` payload format for "cards"?** The user guide mentions card messages but no format is documented.
3. What is the maximum message length?
4. What are the rate limits for sending messages?
5. Can a bot detect when it's been added to or removed from a group?
6. Can a bot get the list of groups it's in?
7. Is there a way to get user display names from UIDs?
8. What happens when messages are sent while the bot is offline (message queue retention)?
9. Can buttons/confirms be sent in DMs or only in groups?
10. What is the `dismissType` field in GroupMessagePayload? When does it apply?
11. Does the Service Account "Open API" have documented endpoints? Can it be used alongside a bot?
12. Can a SuperBox mini app be launched from within a bot conversation?

---

## Quick Start Checklist

1. Download and install Luffa app on your phone
2. Create a Luffa account (generates a mnemonic phrase)
3. Go to https://robot.luffa.im/login and scan the QR code
4. Click "New Bot" to create a bot — note the **UID** and **SecretKey**
5. Install the Python SDK: `pip install luffa-bot-python-sdk`
6. Set `LUFFA_ROBOT_SECRET` environment variable to your bot's SecretKey
7. Run the echo bot: `luffa-bot run --interval 1.0`
8. Open Luffa app, find the bot in contacts, send a message — it should echo back
9. Add the bot to a test group and verify group message handling
10. Port the API calls to your target language (e.g., TypeScript for NestJS)

---

## Hackathon-Specific Notes

- **SDK Author**: Niraj Kulkarni (Sabma Labs, University of Surrey) — email: niraj.kulkarni@luffa.im. Could be a resource for API questions.
- **Hackathon Channel**: https://callup.luffa.im/c/LSEGpNDNioX — accessible via the Luffa app. Check for pinned messages and starter resources.
- **SDK is very new**: v0.1.2 released 2026-03-10 (10 days ago). Only 128 downloads/month. Expect rough edges.
- **Python SDK only**: No official TypeScript/JavaScript SDK exists. Must port API calls manually.
- **Encode AI London Hackathon**: Luffa is a sponsor/partner. The bot platform and Endless chain are the key integration surfaces.
- **Luffa support contacts**: support@luffa.im (general), superbox-Cs@Luffa.im (SuperBox/mini apps), Telegram: @LuffaMessage
- **User guide videos**: https://luffa.gitbook.io/user-guide-videos/ — may contain visual walkthroughs of bot setup
- **DAO governance alignment**: Luffa's Web3 groups are explicitly designed for DAO governance — this aligns perfectly with GovMind's mission. Web3 groups have on-chain identity, multi-sig treasury management, and planned support for group-owned assets (tokens, NFTs). This gives GovMind a strong narrative fit for the Luffa sponsor track.
- **Supported platforms**: iOS 15.0+, Android 7.0+ (except Redmi), macOS (native), Windows, macOS (desktop app)

---

## GovMind Feasibility Assessment

### 1. Can we build a Luffa bot that receives group messages and responds with text + images?

**Text: YES (high confidence).** The API clearly supports receiving group messages (poll-based) and sending text responses to groups. The SDK, test files, and example bot all demonstrate this working.

**Images: LIKELY YES but undocumented (medium confidence).** The [Luffa user guide](https://userguide.luffa.im/bot/key-features-of-bots) explicitly states bots support "text with images, interactive buttons, cards, and external links." The platform supports it — the SDK just doesn't implement it. The `msg` payload likely accepts image fields we haven't discovered yet. As a fallback, sending a URL link to a hosted image will work but won't render inline.

**Confidence level: 9/10 for text, 5/10 for inline images (platform says yes, but no payload format known), 9/10 for image-as-URL workaround.**

### 2. Can the bot send direct messages to specific users?

**YES (high confidence).** The `send_to_user(uid, text)` endpoint is well-documented, tested in the SDK, and demonstrated in the example bot. This is the most straightforward API call.

**This fully supports the vote nudging feature** — send DMs to specific DAO members.

**Confidence level: 9/10.**

### 3. Can the bot interact with Luffa's wallet?

**NO.** There is no API for wallet interaction. The bot API is messaging-only. Bots cannot read balances, trigger transactions, or interact with smart contracts through the bot platform.

**Confidence level: 10/10 (confirmed not possible).**

### 4. Is there a mini app path easier than the bot path?

**NO — SuperBox exists but is harder for a hackathon.** SuperBox is Luffa's fully-featured mini app framework (a WeChat Mini Program clone with WXML/WXSS/JS, a dedicated IDE, and comprehensive docs at https://luffa.im/SuperBox/docs/en/). However, it requires team registration with manual review, a custom IDE download, learning a WeChat-like framework, and a submission + review process before publishing. This makes it impractical for a 48-hour hackathon.

Service Accounts also exist with "Open API Access" and can be linked to bots, but no API documentation was found — just a portal at https://www.luffa.im/developer/service.

**The bot path is the fastest and most practical path for the hackathon.**

### 5. What's the biggest technical risk for integration?

**Three risks, in order:**

1. **Image sending payload unknown (MEDIUM-HIGH RISK)**: The platform confirms bots CAN send images, but the exact `msg` payload format is undocumented. The SDK doesn't implement it. Workaround (sending URL links) is reliable but less impressive in a demo. Mitigation: ask in the hackathon channel or email the SDK author for the image payload format.

2. **Polling latency (MEDIUM RISK)**: The polling model adds 1-2 seconds of latency to message receipt. For a demo, this is acceptable but creates a slightly less responsive feel compared to webhook-based platforms.

3. **Double-encoded JSON (LOW RISK)**: The API's unusual message encoding (JSON strings inside JSON) is error-prone. The SDK handles this, but porting to TypeScript requires careful implementation. The test files provide the exact expected payloads, which helps.

### 6. Honest recommendation: bot API, OpenClaw, or mini app?

**Use the Luffa bot API directly (via ported TypeScript calls, not the Python SDK).**

- OpenClaw doesn't support Luffa as a channel. Dead end.
- Mini apps don't exist as a developer platform. Dead end.
- The Python SDK is clean and well-tested, making it easy to understand the API contract and port to TypeScript.
- The API surface is tiny (3 endpoints) which means fewer things to go wrong.

**Implementation approach for NestJS:**
- Create a `LuffaService` that wraps the 3 HTTP calls (receive, send, sendGroup)
- Run a polling loop (setInterval at 1-2 seconds) that calls `receive`
- When messages arrive, dispatch them to the agent module
- When the agent produces a response, call `send` or `sendGroup`
- For charts: host the PNG on your server (or an S3 bucket) and send the URL

### 7. Is there enough documentation to build with confidence, or plan for fallback?

**There IS enough documentation to build**, thanks to the Python SDK source code which essentially IS the documentation. The SDK's `client.py` shows the exact API endpoints, request formats, and response parsing logic. The test files provide concrete request/response examples.

**However, plan for fallback mode anyway** because:
- Image sending is undocumented and may not work
- The platform is young (SDK has 128 monthly downloads)
- API stability is unknown
- You have a 48-hour window and can't afford to debug Luffa API issues

**Recommendation:** Build the NestJS Luffa module as specified in the PRD — with a swappable transport layer that can use either real Luffa or a mock/dashboard fallback. Test the real Luffa integration early Saturday. If it works, great. If it doesn't work within 2-3 hours, switch to fallback mode.

**The 3-hour rule from the PRD is exactly right.**
