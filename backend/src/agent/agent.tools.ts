import type Anthropic from '@anthropic-ai/sdk';

type ToolDef = Anthropic.Tool;

export const AGENT_TOOLS: ToolDef[] = [
  {
    name: 'get_active_proposals',
    description:
      'Returns all governance proposals with status "active", including vote tallies and participation rates. Use this to see what proposals need attention.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_proposal_detail',
    description:
      'Returns the full text, metadata, and vote breakdown for a specific proposal. Use this when you need to summarise or analyse a specific proposal.',
    input_schema: {
      type: 'object' as const,
      properties: {
        proposal_number: {
          type: 'number',
          description: 'The proposal number (e.g., 48)',
        },
      },
      required: ['proposal_number'],
    },
  },
  {
    name: 'get_voting_status',
    description:
      'Returns who has voted and who has NOT voted on a given proposal, plus time remaining and participation rate. Use this for vote mobilisation.',
    input_schema: {
      type: 'object' as const,
      properties: {
        proposal_number: {
          type: 'number',
          description: 'The proposal number',
        },
      },
      required: ['proposal_number'],
    },
  },
  {
    name: 'get_member_vote_history',
    description:
      'Returns a specific member\'s past voting record and patterns. Use this to personalise nudge messages based on how they voted on similar proposals.',
    input_schema: {
      type: 'object' as const,
      properties: {
        address: {
          type: 'string',
          description: 'The wallet address of the member',
        },
      },
      required: ['address'],
    },
  },
  {
    name: 'get_treasury_summary',
    description:
      'Returns current treasury balances, allocation breakdown, monthly burn rate, runway in months, and concentration risk assessment.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_treasury_transactions',
    description:
      'Returns recent treasury transactions. Can filter by direction (inflow/outflow), category, and time period.',
    input_schema: {
      type: 'object' as const,
      properties: {
        direction: {
          type: 'string',
          enum: ['inflow', 'outflow'],
          description: 'Filter by transaction direction',
        },
        category: {
          type: 'string',
          description: 'Filter by category (e.g., contributor_payment, grant, swap, revenue)',
        },
        days_back: {
          type: 'number',
          description: 'Number of days to look back (default: 30)',
        },
        limit: {
          type: 'number',
          description: 'Max number of transactions to return (default: 20)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_token_transfers',
    description:
      'Returns recent governance token ($GOV) transfer activity. Use this for attack detection — look for coordinated accumulation, new wallets, same-source funding.',
    input_schema: {
      type: 'object' as const,
      properties: {
        hours_back: {
          type: 'number',
          description: 'Number of hours to look back (default: 48)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_wallet_profile',
    description:
      'Returns information about a wallet address including age, transfer history, token balance, and whether it belongs to a known DAO member. Use for proposer risk assessment and attack investigation.',
    input_schema: {
      type: 'object' as const,
      properties: {
        address: {
          type: 'string',
          description: 'The wallet address to profile',
        },
      },
      required: ['address'],
    },
  },
  {
    name: 'query_data',
    description:
      'Execute a read-only SQL query against the DAO database for ad-hoc data questions. Only SELECT queries are allowed. Tables: proposals, votes, members, treasury_transactions, treasury_balances, token_transfers, knowledge, agent_actions_log, nudge_tracking.',
    input_schema: {
      type: 'object' as const,
      properties: {
        sql: {
          type: 'string',
          description: 'The SQL SELECT query to execute',
        },
      },
      required: ['sql'],
    },
  },
  {
    name: 'send_group_message',
    description:
      'Sends a message to the DAO Luffa group chat. Use this to post summaries, alerts, answers, and reminders.',
    input_schema: {
      type: 'object' as const,
      properties: {
        text: {
          type: 'string',
          description: 'The message text to send to the group',
        },
      },
      required: ['text'],
    },
  },
  {
    name: 'send_direct_message',
    description:
      'Sends a DM to a specific DAO member on Luffa. Use this for personalised vote nudges. Requires the member\'s luffa_user_id.',
    input_schema: {
      type: 'object' as const,
      properties: {
        luffa_user_id: {
          type: 'string',
          description: 'The Luffa user ID of the recipient',
        },
        text: {
          type: 'string',
          description: 'The DM text to send',
        },
      },
      required: ['luffa_user_id', 'text'],
    },
  },
  {
    name: 'generate_chart',
    description:
      'Generates a chart image (PNG) from provided data. Returns a URL to the hosted chart image. Use for treasury visualisation, voting stats, etc.',
    input_schema: {
      type: 'object' as const,
      properties: {
        chart_type: {
          type: 'string',
          enum: ['bar', 'line', 'pie', 'doughnut'],
          description: 'Type of chart to generate',
        },
        title: {
          type: 'string',
          description: 'Chart title',
        },
        labels: {
          type: 'array',
          items: { type: 'string' },
          description: 'Labels for the data points',
        },
        datasets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string' },
              data: { type: 'array', items: { type: 'number' } },
            },
            required: ['label', 'data'],
          },
          description: 'Datasets to chart',
        },
      },
      required: ['chart_type', 'title', 'labels', 'datasets'],
    },
  },
  {
    name: 'get_knowledge',
    description:
      'Retrieves team corrections and definitions from the knowledge base. Always check this before answering questions to ensure you use team-specific definitions.',
    input_schema: {
      type: 'object' as const,
      properties: {
        term: {
          type: 'string',
          description: 'The term or topic to look up (e.g., "runway", "core contributor")',
        },
      },
      required: ['term'],
    },
  },
  {
    name: 'store_knowledge',
    description:
      'Stores a new team correction or definition. Use when a team member provides a correction (e.g., "runway should exclude locked staking").',
    input_schema: {
      type: 'object' as const,
      properties: {
        term: {
          type: 'string',
          description: 'The term being defined or corrected',
        },
        definition: {
          type: 'string',
          description: 'The definition or correction',
        },
        source_user: {
          type: 'string',
          description: 'Who provided this correction',
        },
      },
      required: ['term', 'definition', 'source_user'],
    },
  },
  {
    name: 'log_action',
    description:
      'Records what the agent did and why. Call this as the LAST step of every action for the audit trail.',
    input_schema: {
      type: 'object' as const,
      properties: {
        action_type: {
          type: 'string',
          enum: [
            'proposal_summary',
            'vote_nudge',
            'treasury_alert',
            'attack_alert',
            'query_answer',
            'knowledge_update',
          ],
          description: 'Type of action taken',
        },
        trigger: {
          type: 'string',
          enum: ['scheduled', 'new_proposal', 'user_question', 'anomaly_detected', 'manual_trigger'],
          description: 'What triggered this action',
        },
        reasoning: {
          type: 'string',
          description: 'Brief explanation of why you took this action and what you found',
        },
        message_sent: {
          type: 'string',
          description: 'The message you sent to Luffa (if any)',
        },
      },
      required: ['action_type', 'trigger', 'reasoning'],
    },
  },
];
