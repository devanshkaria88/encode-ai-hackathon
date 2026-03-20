import { Controller, Post, Get, Body } from '@nestjs/common';
import { AgentService } from '../agent/agent.service.js';
import { LuffaService } from '../luffa/luffa.service.js';

@Controller('trigger')
export class TriggerController {
  constructor(
    private agent: AgentService,
    private luffa: LuffaService,
  ) {}

  @Get('poll-test')
  async pollTest() {
    const envelopes = await this.luffa.receive();
    return {
      message: 'Raw poll result from Luffa. Look for uid values — that is your group/user ID.',
      envelopes,
    };
  }

  @Post('new-proposal')
  async newProposal(@Body() body: { proposal_number?: number }) {
    const num = body.proposal_number ?? 48;
    const response = await this.agent.run(
      `A new governance proposal has been submitted to MetaDAO: Proposal #${num}. ` +
        `Analyse this proposal, assess the proposer's credibility, calculate the treasury impact, ` +
        `perform a risk assessment, and post a comprehensive summary to the group chat. ` +
        `Include voting deadline and current vote count.`,
    );
    return { trigger: 'new-proposal', proposal_number: num, response };
  }

  @Post('vote-check')
  async voteCheck() {
    const response = await this.agent.run(
      `Check voting participation on all active proposals in MetaDAO. ` +
        `For any proposal with participation below 20% and more than 50% of voting time elapsed, ` +
        `send a general reminder to the group and personalised DM nudges to non-voters who have ` +
        `a luffa_user_id. Personalise each nudge based on the member's voting history — ` +
        `mention how they voted on similar proposals and why their vote matters now.`,
    );
    return { trigger: 'vote-check', response };
  }

  @Post('treasury-check')
  async treasuryCheck() {
    const response = await this.agent.run(
      `Perform a comprehensive treasury health assessment for MetaDAO. ` +
        `Check current balances, burn rate, runway, concentration risk, and recent unusual outflows. ` +
        `If there are any concerns (runway below 6 months, concentration above 70%, ` +
        `or unusual transactions), post an alert to the group chat with specific recommendations.`,
    );
    return { trigger: 'treasury-check', response };
  }

  @Post('attack-check')
  async attackCheck() {
    const response = await this.agent.run(
      `Analyse recent token movements and voting patterns for signs of a governance attack on MetaDAO. ` +
        `Look for: new wallets acquiring large token positions, wallets funded from the same source, ` +
        `coordinated voting on proposals requesting treasury funds, proposals from unknown addresses ` +
        `with large fund requests and no deliverables. ` +
        `If you find a suspicious pattern, post a GOVERNANCE ALERT to the group with evidence ` +
        `and recommended actions. This is critical — the treasury may be at risk.`,
    );
    return { trigger: 'attack-check', response };
  }

  @Post('ask')
  async ask(@Body() body: { question: string; conversation_history?: string[] }) {
    const response = await this.agent.run(
      `A DAO member asked the following question in the Luffa group chat: "${body.question}"\n\n` +
        `Answer this question using the available tools. Check the knowledge base first for any ` +
        `team-specific definitions or corrections. Post your answer to the group chat.`,
      body.conversation_history,
    );
    return { trigger: 'user-question', question: body.question, response };
  }
}
