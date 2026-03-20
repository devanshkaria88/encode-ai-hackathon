import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LuffaService } from './luffa.service.js';
import { AgentService } from '../agent/agent.service.js';
import { DashboardGateway } from '../dashboard/dashboard.gateway.js';
import type { LuffaEnvelope, LuffaIncomingMessage } from './luffa.interfaces.js';

@Injectable()
export class LuffaPollingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(LuffaPollingService.name);
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private readonly seenIds = new Set<string>();
  private readonly MAX_SEEN = 10_000;
  private readonly enabled: boolean;
  private processing = false;

  constructor(
    private luffaService: LuffaService,
    private config: ConfigService,
    @Inject(forwardRef(() => AgentService)) private agent: AgentService,
    @Inject(forwardRef(() => DashboardGateway)) private dashboard: DashboardGateway,
  ) {
    this.enabled = this.config.get<string>('LUFFA_POLLING_ENABLED', 'false') === 'true';
  }

  onModuleInit() {
    if (!this.enabled) {
      this.logger.log('Luffa polling disabled (set LUFFA_POLLING_ENABLED=true to enable)');
      return;
    }
    this.logger.log('Starting Luffa polling (1.5s interval)');
    this.intervalHandle = setInterval(() => void this.poll(), 1500);
  }

  onModuleDestroy() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  private async poll() {
    if (this.processing) return;
    try {
      const envelopes = await this.luffaService.receive();
      for (const envelope of envelopes) {
        for (const message of envelope.messages) {
          if (this.seenIds.has(message.msgId)) continue;
          this.seenIds.add(message.msgId);
          if (this.seenIds.size > this.MAX_SEEN) {
            const first = this.seenIds.values().next().value;
            if (first) this.seenIds.delete(first);
          }
          await this.dispatch(envelope, message);
        }
      }
    } catch (err) {
      this.logger.error('Poll cycle failed:', (err as Error).message);
    }
  }

  private async dispatch(envelope: LuffaEnvelope, message: LuffaIncomingMessage) {
    const isGroup = envelope.type === 1;
    const senderUid = message.uid ?? envelope.uid;

    this.logger.log(
      `New ${isGroup ? 'group' : 'DM'} message from ${senderUid}: ${message.text.substring(0, 100)}`,
    );

    this.dashboard.emitLuffaMessageReceived(
      isGroup ? 'group' : 'dm',
      message.text,
      senderUid,
    );

    if (isGroup) {
      this.agent.setLastKnownGroupId(envelope.uid);
    }

    if (!message.text || message.text.trim().length === 0) return;

    this.processing = true;
    try {
      const replyTo = isGroup
        ? { type: 'group' as const, uid: envelope.uid }
        : { type: 'dm' as const, uid: envelope.uid };

      const context = isGroup
        ? `A DAO member sent this message in the Luffa group chat: "${message.text}"\n\nRespond helpfully. If it's a question, answer it using available tools. If it's a correction or definition, store it. Check the knowledge base for relevant corrections before answering. Post your response to the group chat.`
        : `A DAO member sent you this direct message: "${message.text}"\n\nRespond helpfully via DM. If it's a question, answer it using available tools. Check the knowledge base first.`;

      await this.agent.run(context, undefined, replyTo);
    } catch (err) {
      this.logger.error('Failed to process message:', (err as Error).message);
    } finally {
      this.processing = false;
    }
  }
}
