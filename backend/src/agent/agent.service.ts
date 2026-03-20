import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { GovernanceService } from '../governance/governance.service.js';
import { TreasuryService } from '../treasury/treasury.service.js';
import { SecurityService } from '../security/security.service.js';
import { KnowledgeService } from '../knowledge/knowledge.service.js';
import { ChartService } from '../chart/chart.service.js';
import { LuffaService } from '../luffa/luffa.service.js';
import { DashboardGateway } from '../dashboard/dashboard.gateway.js';
import { SYSTEM_PROMPT } from './agent.system-prompt.js';
import { AGENT_TOOLS } from './agent.tools.js';
import { DataSource } from 'typeorm';

const MAX_ITERATIONS = 10;
const TIMEOUT_MS = 120_000;

interface ToolCallStep {
  tool: string;
  input: Record<string, unknown>;
  output: unknown;
  description: string;
}

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private readonly client: Anthropic;
  private lastKnownGroupId: string | null = null;
  private activeGroupId: string | null = null;
  private activeSenderUid: string | null = null;

  constructor(
    private config: ConfigService,
    private governance: GovernanceService,
    private treasury: TreasuryService,
    private security: SecurityService,
    private knowledge: KnowledgeService,
    private chart: ChartService,
    private luffa: LuffaService,
    private dashboard: DashboardGateway,
    private dataSource: DataSource,
  ) {
    this.client = new Anthropic({
      apiKey: this.config.get<string>('ANTHROPIC_API_KEY', ''),
    });
    const envGroupId = this.config.get<string>('LUFFA_GROUP_ID', '');
    if (envGroupId && envGroupId !== 'your_group_id_here') {
      this.lastKnownGroupId = envGroupId;
    }
  }

  setLastKnownGroupId(groupId: string) {
    this.lastKnownGroupId = groupId;
    this.logger.log(`Auto-learned group ID: ${groupId}`);
  }

  async run(
    triggerContext: string,
    conversationHistory?: string[],
    replyTo?: { type: 'group' | 'dm'; uid: string },
  ): Promise<string> {
    this.activeGroupId = replyTo?.type === 'group' ? replyTo.uid : this.lastKnownGroupId;
    this.activeSenderUid = replyTo?.type === 'dm' ? replyTo.uid : null;
    const steps: ToolCallStep[] = [];
    const startTime = Date.now();

    this.dashboard.emitAgentStart(triggerContext);

    const messages: Anthropic.MessageParam[] = [];

    if (conversationHistory?.length) {
      messages.push({
        role: 'user',
        content: `Recent group chat messages for context:\n${conversationHistory.join('\n')}\n\n---\n\nCurrent task: ${triggerContext}`,
      });
    } else {
      messages.push({ role: 'user', content: triggerContext });
    }

    try {
      for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
        if (Date.now() - startTime > TIMEOUT_MS) {
          const errMsg = 'Agent loop timed out after 30 seconds.';
          this.dashboard.emitAgentError(errMsg);
          return errMsg;
        }

        const response = await this.client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          tools: AGENT_TOOLS,
          messages,
        });

        if (response.stop_reason === 'end_turn') {
          const textBlock = response.content.find((b) => b.type === 'text');
          const finalText = textBlock && 'text' in textBlock ? textBlock.text : '';
          this.dashboard.emitAgentComplete(finalText, steps);
          return finalText;
        }

        if (response.stop_reason === 'tool_use') {
          const toolBlocks = response.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
          );

          messages.push({ role: 'assistant', content: response.content });

          const toolResults: Anthropic.ToolResultBlockParam[] = [];

          for (const toolBlock of toolBlocks) {
            const toolName = toolBlock.name;
            const toolInput = toolBlock.input as Record<string, unknown>;

            this.dashboard.emitToolStart(toolName, toolInput);

            let result: unknown;
            try {
              result = await this.executeTool(toolName, toolInput);
            } catch (err) {
              result = { error: `Tool "${toolName}" failed: ${(err as Error).message}` };
            }

            const resultStr =
              typeof result === 'string' ? result : JSON.stringify(result, null, 2);
            const truncated =
              resultStr.length > 6000 ? resultStr.substring(0, 6000) + '\n...(truncated)' : resultStr;

            const step: ToolCallStep = {
              tool: toolName,
              input: toolInput,
              output: result,
              description: this.describeToolCall(toolName, toolInput),
            };
            steps.push(step);

            this.dashboard.emitToolResult(toolName, result);

            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolBlock.id,
              content: truncated,
            });
          }

          messages.push({ role: 'user', content: toolResults });
          continue;
        }

        // Unexpected stop reason — extract text and return
        const textBlock = response.content.find((b) => b.type === 'text');
        const text = textBlock && 'text' in textBlock ? textBlock.text : 'No response generated.';
        this.dashboard.emitAgentComplete(text, steps);
        return text;
      }

      const errMsg = 'Agent reached maximum iterations (10) without producing a final response.';
      this.dashboard.emitAgentError(errMsg);
      return errMsg;
    } catch (err) {
      const errMsg = `Agent error: ${(err as Error).message}`;
      this.logger.error(errMsg);
      this.dashboard.emitAgentError(errMsg);
      return errMsg;
    }
  }

  private async executeTool(
    name: string,
    input: Record<string, unknown>,
  ): Promise<unknown> {
    switch (name) {
      case 'get_active_proposals':
        return this.governance.getActiveProposals();

      case 'get_proposal_detail':
        return this.governance.getProposalDetail(input.proposal_number as number);

      case 'get_voting_status':
        return this.governance.getVotingStatus(input.proposal_number as number);

      case 'get_member_vote_history':
        return this.governance.getMemberVoteHistory(input.address as string);

      case 'get_treasury_summary':
        return this.treasury.getTreasurySummary();

      case 'get_treasury_transactions':
        return this.treasury.getTransactions({
          direction: input.direction as 'inflow' | 'outflow' | undefined,
          category: input.category as string | undefined,
          daysBack: input.days_back as number | undefined,
          limit: input.limit as number | undefined,
        });

      case 'get_token_transfers':
        return this.security.getTokenTransfers(
          (input.hours_back as number | undefined) ?? 48,
        );

      case 'get_wallet_profile':
        return this.security.getWalletProfile(input.address as string);

      case 'query_data':
        return this.executeQuery(input.sql as string);

      case 'send_group_message': {
        const groupId = this.activeGroupId;
        if (!groupId) {
          return { error: 'No group ID available. Send a message to the bot in a group first so it learns the group ID.' };
        }
        await this.luffa.sendToGroup(groupId, input.text as string);
        this.dashboard.emitLuffaMessageSent('group', input.text as string);
        return { sent: true, channel: 'group', text: input.text };
      }

      case 'send_direct_message': {
        const recipientId = (input.luffa_user_id as string) || this.activeSenderUid;
        if (!recipientId) {
          return { error: 'No recipient ID provided and no active sender context.' };
        }
        await this.luffa.sendToUser(recipientId, input.text as string);
        this.dashboard.emitLuffaMessageSent('dm', input.text as string, recipientId);
        return { sent: true, channel: 'dm', recipient: recipientId, text: input.text };
      }

      case 'generate_chart':
        return this.chart.generate({
          type: input.chart_type as 'bar' | 'line' | 'pie' | 'doughnut',
          title: input.title as string,
          labels: input.labels as string[],
          datasets: input.datasets as Array<{ label: string; data: number[] }>,
        });

      case 'get_knowledge':
        return this.knowledge.getKnowledge(input.term as string);

      case 'store_knowledge':
        return this.knowledge.storeKnowledge(
          input.term as string,
          input.definition as string,
          input.source_user as string,
        );

      case 'log_action':
        return this.knowledge.logAction({
          action_type: input.action_type as string,
          trigger: input.trigger as string,
          reasoning: input.reasoning as string,
          tools_used: [], // filled by the caller if needed
          message_sent: (input.message_sent as string) ?? null,
        });

      default:
        return { error: `Unknown tool: ${name}` };
    }
  }

  private async executeQuery(sql: string): Promise<unknown> {
    const forbidden = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|GRANT|REVOKE)\b/i;
    if (forbidden.test(sql)) {
      return { error: 'Only SELECT queries are allowed. Write operations are forbidden.' };
    }

    try {
      const result = await this.dataSource.query(sql);
      const rows = Array.isArray(result) ? result.slice(0, 50) : result;
      return { rows, row_count: Array.isArray(result) ? result.length : 1 };
    } catch (err) {
      return { error: `Query failed: ${(err as Error).message}` };
    }
  }

  private describeToolCall(name: string, input: Record<string, unknown>): string {
    switch (name) {
      case 'get_active_proposals':
        return 'Fetching active proposals...';
      case 'get_proposal_detail':
        return `Fetching details for proposal #${input.proposal_number}...`;
      case 'get_voting_status':
        return `Checking voting status for proposal #${input.proposal_number}...`;
      case 'get_member_vote_history':
        return `Looking up voting history for ${(input.address as string).substring(0, 10)}...`;
      case 'get_treasury_summary':
        return 'Retrieving treasury summary...';
      case 'get_treasury_transactions':
        return 'Fetching treasury transactions...';
      case 'get_token_transfers':
        return 'Scanning recent token transfers...';
      case 'get_wallet_profile':
        return `Profiling wallet ${(input.address as string).substring(0, 10)}...`;
      case 'query_data':
        return 'Running custom data query...';
      case 'send_group_message':
        return 'Sending message to group...';
      case 'send_direct_message':
        return `Sending DM to ${input.luffa_user_id}...`;
      case 'generate_chart':
        return `Generating ${input.chart_type} chart: ${input.title}...`;
      case 'get_knowledge':
        return `Checking knowledge base for "${input.term}"...`;
      case 'store_knowledge':
        return `Storing team correction: "${input.term}"...`;
      case 'log_action':
        return 'Logging action...';
      default:
        return `Calling ${name}...`;
    }
  }
}
