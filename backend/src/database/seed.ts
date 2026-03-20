import 'reflect-metadata';
import { AppDataSource } from '../data-source.js';
import { Proposal } from '../governance/entities/proposal.entity.js';
import { Vote } from '../governance/entities/vote.entity.js';
import { Member } from '../governance/entities/member.entity.js';
import { TreasuryTransaction } from '../treasury/entities/treasury-transaction.entity.js';
import { TreasuryBalance } from '../treasury/entities/treasury-balance.entity.js';
import { TokenTransfer } from '../security/entities/token-transfer.entity.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function hoursAgo(n: number): Date {
  const d = new Date();
  d.setHours(d.getHours() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function addr(suffix: string): string {
  return `0x${suffix.padStart(40, '0')}`;
}

function txHash(i: number): string {
  return `0x${i.toString(16).padStart(64, 'a')}`;
}

// ---------------------------------------------------------------------------
// Core members (47 total). First 5 have luffa_user_id for DM testing.
// ---------------------------------------------------------------------------

const CORE_MEMBERS = [
  { name: 'Alice Chen', suffix: '7f3a1', balance: 8500, monthsAgo: 18, luffa: 'luffa_alice_001' },
  { name: 'Bob Martinez', suffix: '8b2c4', balance: 6200, monthsAgo: 16, luffa: 'luffa_bob_002' },
  { name: 'Carol Wei', suffix: '3d9e7', balance: 5100, monthsAgo: 15, luffa: 'luffa_carol_003' },
  { name: 'David Okonkwo', suffix: 'a1f5b', balance: 4300, monthsAgo: 14, luffa: 'luffa_david_004' },
  { name: 'Elena Popov', suffix: 'c6d2a', balance: 3800, monthsAgo: 12, luffa: 'luffa_elena_005' },
  { name: 'Frank Liu', suffix: 'e4b38', balance: 3200, monthsAgo: 11, luffa: null },
  { name: 'Grace Kim', suffix: 'f7c91', balance: 2800, monthsAgo: 10, luffa: null },
  { name: 'Hassan Ali', suffix: '12d4e', balance: 2500, monthsAgo: 10, luffa: null },
  { name: 'Isha Patel', suffix: '23e5f', balance: 2200, monthsAgo: 9, luffa: null },
  { name: 'Jake Thompson', suffix: '34f60', balance: 1900, monthsAgo: 8, luffa: null },
  { name: 'Keiko Tanaka', suffix: '45071', balance: 1700, monthsAgo: 8, luffa: null },
  { name: 'Liam Murphy', suffix: '56182', balance: 1500, monthsAgo: 7, luffa: null },
  { name: 'Maya Singh', suffix: '67293', balance: 1300, monthsAgo: 7, luffa: null },
  { name: 'Noah Andersen', suffix: '783a4', balance: 1100, monthsAgo: 6, luffa: null },
  { name: 'Olivia Brown', suffix: '894b5', balance: 950, monthsAgo: 6, luffa: null },
];

const GENERAL_MEMBERS: { name: string; suffix: string; balance: number; monthsAgo: number }[] = [];
const names = [
  'Peter Vu', 'Quinn Roberts', 'Rita Fernandez', 'Sam Jackson', 'Tina Zhao',
  'Uma Kapoor', 'Victor Novak', 'Wendy Chang', 'Xavier Reis', 'Yuki Sato',
  'Zara Ahmed', 'Aaron Cole', 'Bianca Rossi', 'Carlos Diaz', 'Diana Lee',
  'Ethan Brooks', 'Fatima Noor', 'George Park', 'Hana Müller', 'Ian Stewart',
  'Julia Costa', 'Kevin Wright', 'Luna Garcia', 'Marcus Hahn', 'Nadia Ivanova',
  'Oscar Tran', 'Paula Schmidt', 'Ryan Choi', 'Sofia Morales', 'Tom Fischer',
  'Ursula Katz', 'Wei Zhang',
];
for (let i = 0; i < names.length; i++) {
  GENERAL_MEMBERS.push({
    name: names[i],
    suffix: `gen${(i + 1).toString().padStart(4, '0')}`,
    balance: 200 + Math.floor(800 * ((names.length - i) / names.length)),
    monthsAgo: 1 + (i % 6),
  });
}

const ALL_MEMBER_DEFS = [
  ...CORE_MEMBERS.map((m) => ({ ...m, luffa: m.luffa })),
  ...GENERAL_MEMBERS.map((m) => ({ ...m, luffa: null })),
];

// ---------------------------------------------------------------------------
// Proposals — 10 total, matching PRD demo script
// ---------------------------------------------------------------------------

interface ProposalDef {
  number: number;
  title: string;
  body: string;
  proposer: string;
  amount: number;
  recipient: string | null;
  status: 'active' | 'passed' | 'rejected' | 'executed' | 'cancelled';
  startDaysAgo: number;
  endDaysAgo: number | null;
  endDaysFromNow: number | null;
}

const PROPOSALS: ProposalDef[] = [
  {
    number: 40,
    title: 'Upgrade Smart Contract Auditor Retainer',
    body: 'Proposal to renew our smart contract auditing retainer with OpenZeppelin for another 6 months. Current coverage expires April 15. Cost: 12 ETH for the 6-month engagement, covering up to 3 audit cycles on our governance and treasury contracts.',
    proposer: '7f3a1',
    amount: 12,
    recipient: addr('audit01'),
    status: 'executed',
    startDaysAgo: 90,
    endDaysAgo: 83,
    endDaysFromNow: null,
  },
  {
    number: 41,
    title: 'Community Developer Bounty Program',
    body: 'Launch a developer bounty program to incentivize external contributors. 20 ETH allocated across 40 bounties ranging from bug fixes (0.1 ETH) to feature development (2 ETH). Program runs for 3 months with monthly progress reports.',
    proposer: '8b2c4',
    amount: 20,
    recipient: addr('bounty01'),
    status: 'passed',
    startDaysAgo: 75,
    endDaysAgo: 68,
    endDaysFromNow: null,
  },
  {
    number: 42,
    title: 'Treasury Diversification: Convert 30 ETH to USDC',
    body: 'Convert 30 ETH from the treasury to USDC to reduce volatility exposure. Current treasury is 89% in GOV token, which creates concentration risk. This conversion would bring stablecoin allocation to ~25%.',
    proposer: '3d9e7',
    amount: 0,
    recipient: null,
    status: 'passed',
    startDaysAgo: 60,
    endDaysAgo: 53,
    endDaysFromNow: null,
  },
  {
    number: 43,
    title: 'Hire Full-Time Protocol Engineer',
    body: 'Hire a full-time protocol engineer at 5 ETH/month for 6 months (30 ETH total). The candidate has been a top bounty contributor and has shipped 3 protocol improvements. This would be our first full-time technical hire.',
    proposer: '7f3a1',
    amount: 30,
    recipient: addr('hire01'),
    status: 'passed',
    startDaysAgo: 50,
    endDaysAgo: 43,
    endDaysFromNow: null,
  },
  {
    number: 44,
    title: 'Governance Parameter Update: Quorum to 15%',
    body: 'Lower the governance quorum requirement from 20% to 15% of token-weighted votes. Current 20% threshold is rarely met, causing important proposals to fail due to apathy rather than opposition. Analysis of last 20 proposals shows average participation of 22% — too close to quorum.',
    proposer: 'a1f5b',
    amount: 0,
    recipient: null,
    status: 'rejected',
    startDaysAgo: 40,
    endDaysAgo: 33,
    endDaysFromNow: null,
  },
  {
    number: 45,
    title: 'Sponsor ETHGlobal Hackathon — Bronze Tier',
    body: 'Sponsor the next ETHGlobal hackathon at Bronze tier (8 ETH). Gets us a booth, logo placement, and access to the builder community. Potential to recruit contributors and raise awareness of MetaDAO governance tooling.',
    proposer: 'c6d2a',
    amount: 8,
    recipient: addr('sponsor01'),
    status: 'passed',
    startDaysAgo: 30,
    endDaysAgo: 23,
    endDaysFromNow: null,
  },
  {
    number: 46,
    title: 'Emergency Bug Bounty: Critical Vulnerability',
    body: 'Retroactive bug bounty payment of 15 ETH to white hat researcher who discovered a critical reentrancy vulnerability in our staking contract. Vulnerability was responsibly disclosed and patched within 4 hours. This payment follows our published bug bounty guidelines.',
    proposer: '7f3a1',
    amount: 15,
    recipient: addr('whitehat01'),
    status: 'executed',
    startDaysAgo: 20,
    endDaysAgo: 15,
    endDaysFromNow: null,
  },
  {
    number: 47,
    title: 'Create DAO Legal Wrapper (Cayman Foundation)',
    body: 'Establish a Cayman Islands foundation as the legal wrapper for MetaDAO. Cost: 10 ETH for legal fees plus 2 ETH annual maintenance. This provides legal standing for the DAO to enter contracts, hold IP, and interact with traditional financial institutions.',
    proposer: 'e4b38',
    amount: 10,
    recipient: addr('legal01'),
    status: 'cancelled',
    startDaysAgo: 15,
    endDaysAgo: 10,
    endDaysFromNow: null,
  },
  // --- ACTIVE proposals for demo ---
  {
    number: 48,
    title: 'Fund Marketing Sprint Q2',
    body: 'Requests 45 ETH ($90,000) from treasury to fund a 3-month marketing campaign targeting DeFi users. Deliverables include: redesigned landing page, Twitter/X content strategy (3 posts/week), sponsorship of 2 DeFi podcasts, and a referral program with $GOV token incentives. Success metrics: 500 new token holders, 2x governance participation, 10k unique site visitors/month.',
    proposer: '7f3a1',
    amount: 45,
    recipient: addr('marketing01'),
    status: 'active',
    startDaysAgo: 3,
    endDaysAgo: null,
    endDaysFromNow: 4,
  },
  {
    number: 49,
    title: 'Strategic Partnership Fund Transfer',
    body: 'Transfer 80 ETH to external wallet 0x9e2b...unknown for a "strategic partnership" with an unnamed DeFi protocol. The proposer claims this will provide liquidity incentives and cross-promotion. No specific milestones, deliverables, or success metrics provided. Funds would be sent in a single transaction with no vesting or clawback mechanism.',
    proposer: '9e2b0',
    amount: 80,
    recipient: addr('9e2b0drain'),
    status: 'active',
    startDaysAgo: 1,
    endDaysAgo: null,
    endDaysFromNow: 6,
  },
];

// ---------------------------------------------------------------------------
// Seed runner
// ---------------------------------------------------------------------------

async function seed() {
  await AppDataSource.initialize();
  console.log('Connected to database. Seeding...');

  // Clear tables in FK order
  await AppDataSource.query('TRUNCATE nudge_tracking, votes, token_transfers, treasury_transactions, treasury_balances, knowledge, agent_actions_log, proposals, members CASCADE');

  // --- Members ---
  const memberRepo = AppDataSource.getRepository(Member);
  const members: Member[] = [];
  for (const def of ALL_MEMBER_DEFS) {
    const m = memberRepo.create({
      address: addr(def.suffix),
      display_name: def.name,
      token_balance: def.balance,
      join_date: daysAgo(def.monthsAgo * 30),
      luffa_user_id: def.luffa ?? null,
    });
    members.push(m);
  }
  await memberRepo.save(members);
  console.log(`  ✓ ${members.length} members`);

  // --- Proposals ---
  const proposalRepo = AppDataSource.getRepository(Proposal);
  const proposals: Proposal[] = [];
  for (const def of PROPOSALS) {
    const p = proposalRepo.create({
      proposal_number: def.number,
      title: def.title,
      body: def.body,
      proposer_address: addr(def.proposer),
      requested_amount: def.amount,
      recipient_address: def.recipient,
      status: def.status,
      vote_start: daysAgo(def.startDaysAgo),
      vote_end: def.endDaysFromNow != null ? daysFromNow(def.endDaysFromNow) : daysAgo(def.endDaysAgo!),
      created_at: daysAgo(def.startDaysAgo),
    });
    proposals.push(p);
  }
  await proposalRepo.save(proposals);
  console.log(`  ✓ ${proposals.length} proposals`);

  // --- Votes ---
  const voteRepo = AppDataSource.getRepository(Vote);
  const allVotes: Vote[] = [];

  for (const proposal of proposals) {
    if (proposal.status === 'cancelled') continue;

    let voterPool: Member[];
    let forRatio: number;

    if (proposal.proposal_number === 48) {
      // Active demo proposal — only 8 of 47 voted (17% participation)
      voterPool = members.slice(0, 8);
      forRatio = 0.6;
    } else if (proposal.proposal_number === 49) {
      // Attack proposal — only suspicious wallets + 2 real members voted
      voterPool = members.slice(0, 2);
      forRatio = 0;
    } else if (proposal.status === 'rejected') {
      voterPool = members.slice(0, Math.floor(members.length * 0.35));
      forRatio = 0.35;
    } else {
      const participation = 0.3 + Math.random() * 0.35;
      voterPool = members.slice(0, Math.floor(members.length * participation));
      forRatio = 0.6 + Math.random() * 0.25;
    }

    for (let i = 0; i < voterPool.length; i++) {
      const member = voterPool[i];
      let choice: 'for' | 'against' | 'abstain';
      if (i / voterPool.length < forRatio) {
        choice = 'for';
      } else if (Math.random() < 0.15) {
        choice = 'abstain';
      } else {
        choice = 'against';
      }

      allVotes.push(
        voteRepo.create({
          proposal_id: proposal.id,
          voter_address: member.address,
          vote: choice,
          voting_power: Number(member.token_balance),
          voted_at: new Date(
            proposal.vote_start.getTime() +
              Math.random() * (proposal.vote_end.getTime() - proposal.vote_start.getTime()),
          ),
        }),
      );
    }

    // For proposal #49 (attack), add 3 suspicious wallet votes
    if (proposal.proposal_number === 49) {
      const attackWallets = [addr('atk001'), addr('atk002'), addr('atk003')];
      for (const wallet of attackWallets) {
        allVotes.push(
          voteRepo.create({
            proposal_id: proposal.id,
            voter_address: wallet,
            vote: 'for',
            voting_power: 4000,
            voted_at: hoursAgo(2 + Math.floor(Math.random() * 6)),
          }),
        );
      }
    }
  }

  await voteRepo.save(allVotes);
  console.log(`  ✓ ${allVotes.length} votes`);

  // --- Treasury Balances ---
  const balanceRepo = AppDataSource.getRepository(TreasuryBalance);
  await balanceRepo.save([
    balanceRepo.create({ token: 'GOV', balance: 116.5, usd_value: 233000, percentage: 82 }),
    balanceRepo.create({ token: 'USDC', balance: 18.2, usd_value: 36400, percentage: 13 }),
    balanceRepo.create({ token: 'DAI', balance: 7.6, usd_value: 15200, percentage: 5 }),
  ]);
  console.log('  ✓ 3 treasury balances');

  // --- Treasury Transactions (6 months) ---
  const txRepo = AppDataSource.getRepository(TreasuryTransaction);
  const txs: TreasuryTransaction[] = [];
  let txCounter = 1;

  const txTemplates: {
    direction: 'inflow' | 'outflow';
    amount: number;
    token: string;
    category: string;
    memo: string;
    daysAgo: number;
  }[] = [
    // Revenue inflows
    { direction: 'inflow', amount: 15.0, token: 'ETH', category: 'revenue', memo: 'Protocol fees — January', daysAgo: 150 },
    { direction: 'inflow', amount: 18.5, token: 'ETH', category: 'revenue', memo: 'Protocol fees — February', daysAgo: 120 },
    { direction: 'inflow', amount: 12.0, token: 'ETH', category: 'revenue', memo: 'Protocol fees — March', daysAgo: 90 },
    { direction: 'inflow', amount: 22.0, token: 'ETH', category: 'revenue', memo: 'Protocol fees — April', daysAgo: 60 },
    { direction: 'inflow', amount: 16.3, token: 'ETH', category: 'revenue', memo: 'Protocol fees — May', daysAgo: 30 },
    { direction: 'inflow', amount: 8.7, token: 'ETH', category: 'revenue', memo: 'Protocol fees — June (partial)', daysAgo: 5 },
    // Grant inflows
    { direction: 'inflow', amount: 50.0, token: 'ETH', category: 'grant', memo: 'Endless Foundation grant', daysAgo: 140 },
    // Outflows — contributor payments
    { direction: 'outflow', amount: 5.0, token: 'ETH', category: 'contributor_payment', memo: 'Alice Chen — core contributor monthly', daysAgo: 145 },
    { direction: 'outflow', amount: 5.0, token: 'ETH', category: 'contributor_payment', memo: 'Alice Chen — core contributor monthly', daysAgo: 115 },
    { direction: 'outflow', amount: 5.0, token: 'ETH', category: 'contributor_payment', memo: 'Alice Chen — core contributor monthly', daysAgo: 85 },
    { direction: 'outflow', amount: 5.0, token: 'ETH', category: 'contributor_payment', memo: 'Alice Chen — core contributor monthly', daysAgo: 55 },
    { direction: 'outflow', amount: 5.0, token: 'ETH', category: 'contributor_payment', memo: 'Alice Chen — core contributor monthly', daysAgo: 25 },
    { direction: 'outflow', amount: 3.5, token: 'ETH', category: 'contributor_payment', memo: 'Bob Martinez — dev lead monthly', daysAgo: 145 },
    { direction: 'outflow', amount: 3.5, token: 'ETH', category: 'contributor_payment', memo: 'Bob Martinez — dev lead monthly', daysAgo: 115 },
    { direction: 'outflow', amount: 3.5, token: 'ETH', category: 'contributor_payment', memo: 'Bob Martinez — dev lead monthly', daysAgo: 85 },
    { direction: 'outflow', amount: 3.5, token: 'ETH', category: 'contributor_payment', memo: 'Bob Martinez — dev lead monthly', daysAgo: 55 },
    { direction: 'outflow', amount: 3.5, token: 'ETH', category: 'contributor_payment', memo: 'Bob Martinez — dev lead monthly', daysAgo: 25 },
    { direction: 'outflow', amount: 2.0, token: 'ETH', category: 'contributor_payment', memo: 'Carol Wei — ops monthly', daysAgo: 115 },
    { direction: 'outflow', amount: 2.0, token: 'ETH', category: 'contributor_payment', memo: 'Carol Wei — ops monthly', daysAgo: 85 },
    { direction: 'outflow', amount: 2.0, token: 'ETH', category: 'contributor_payment', memo: 'Carol Wei — ops monthly', daysAgo: 55 },
    { direction: 'outflow', amount: 2.0, token: 'ETH', category: 'contributor_payment', memo: 'Carol Wei — ops monthly', daysAgo: 25 },
    // Outflows — grants / bounties
    { direction: 'outflow', amount: 12.0, token: 'ETH', category: 'grant', memo: 'Proposal #40 — OpenZeppelin audit retainer', daysAgo: 82 },
    { direction: 'outflow', amount: 20.0, token: 'ETH', category: 'grant', memo: 'Proposal #41 — Developer bounty program', daysAgo: 67 },
    { direction: 'outflow', amount: 8.0, token: 'ETH', category: 'grant', memo: 'Proposal #45 — ETHGlobal sponsorship', daysAgo: 22 },
    { direction: 'outflow', amount: 15.0, token: 'ETH', category: 'grant', memo: 'Proposal #46 — Bug bounty payout', daysAgo: 14 },
    // Swap
    { direction: 'outflow', amount: 30.0, token: 'ETH', category: 'swap', memo: 'Proposal #42 — Treasury diversification to USDC', daysAgo: 52 },
    { direction: 'inflow', amount: 30.0, token: 'USDC', category: 'swap', memo: 'Received USDC from diversification swap', daysAgo: 52 },
    // Dev bounty payouts (recent — drives up burn rate)
    { direction: 'outflow', amount: 1.5, token: 'ETH', category: 'grant', memo: 'Bounty: Fix token approval UI', daysAgo: 18 },
    { direction: 'outflow', amount: 2.0, token: 'ETH', category: 'grant', memo: 'Bounty: Implement delegation', daysAgo: 12 },
    { direction: 'outflow', amount: 0.8, token: 'ETH', category: 'grant', memo: 'Bounty: Fix staking edge case', daysAgo: 8 },
    { direction: 'outflow', amount: 1.2, token: 'ETH', category: 'grant', memo: 'Bounty: Add vote delegation UI', daysAgo: 4 },
    { direction: 'outflow', amount: 0.5, token: 'ETH', category: 'grant', memo: 'Bounty: Documentation updates', daysAgo: 2 },
  ];

  for (const t of txTemplates) {
    txs.push(
      txRepo.create({
        tx_hash: txHash(txCounter++),
        direction: t.direction,
        amount: t.amount,
        token: t.token,
        counterparty: addr(`cp${txCounter}`),
        category: t.category,
        memo: t.memo,
        timestamp: daysAgo(t.daysAgo),
      }),
    );
  }

  await txRepo.save(txs);
  console.log(`  ✓ ${txs.length} treasury transactions`);

  // --- Token Transfers (governance attack pattern) ---
  const transferRepo = AppDataSource.getRepository(TokenTransfer);
  const transfers: TokenTransfer[] = [];

  // Normal transfers — existing members moving tokens over past month
  const normalTransfers = [
    { from: '7f3a1', to: '8b2c4', amount: 200, hoursAgo: 480 },
    { from: '3d9e7', to: 'a1f5b', amount: 150, hoursAgo: 360 },
    { from: 'e4b38', to: 'f7c91', amount: 100, hoursAgo: 240 },
    { from: '12d4e', to: '23e5f', amount: 80, hoursAgo: 120 },
    { from: '34f60', to: '45071', amount: 50, hoursAgo: 72 },
  ];

  for (const t of normalTransfers) {
    transfers.push(
      transferRepo.create({
        from_address: addr(t.from),
        to_address: addr(t.to),
        amount: t.amount,
        timestamp: hoursAgo(t.hoursAgo),
      }),
    );
  }

  // ATTACK PATTERN: Source wallet funds 3 new wallets with 4000 GOV each
  const sourceWallet = addr('srcatk');
  const attackWallets = [addr('atk001'), addr('atk002'), addr('atk003')];

  // Source acquires tokens from exchange 36 hours ago
  transfers.push(
    transferRepo.create({
      from_address: addr('exchange01'),
      to_address: sourceWallet,
      amount: 12500,
      timestamp: hoursAgo(36),
    }),
  );

  // Source distributes to 3 wallets over 18-22 hours ago
  for (let i = 0; i < attackWallets.length; i++) {
    transfers.push(
      transferRepo.create({
        from_address: sourceWallet,
        to_address: attackWallets[i],
        amount: 4000,
        timestamp: hoursAgo(22 - i * 2),
      }),
    );
  }

  await transferRepo.save(transfers);
  console.log(`  ✓ ${transfers.length} token transfers (including attack pattern)`);

  console.log('\nSeed complete!');
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
