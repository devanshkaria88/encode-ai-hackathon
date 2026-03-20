import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Proposal } from './governance/entities/proposal.entity.js';
import { Vote } from './governance/entities/vote.entity.js';
import { Member } from './governance/entities/member.entity.js';
import { TreasuryTransaction } from './treasury/entities/treasury-transaction.entity.js';
import { TreasuryBalance } from './treasury/entities/treasury-balance.entity.js';
import { TokenTransfer } from './security/entities/token-transfer.entity.js';
import { Knowledge } from './knowledge/entities/knowledge.entity.js';
import { AgentAction } from './knowledge/entities/agent-action.entity.js';
import { NudgeTracking } from './knowledge/entities/nudge-tracking.entity.js';

config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'govmind',
  entities: [
    Proposal,
    Vote,
    Member,
    TreasuryTransaction,
    TreasuryBalance,
    TokenTransfer,
    Knowledge,
    AgentAction,
    NudgeTracking,
  ],
  synchronize: true,
});
