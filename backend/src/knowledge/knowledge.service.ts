import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Knowledge } from './entities/knowledge.entity.js';
import { AgentAction } from './entities/agent-action.entity.js';
import { NudgeTracking } from './entities/nudge-tracking.entity.js';

@Injectable()
export class KnowledgeService {
  constructor(
    @InjectRepository(Knowledge) private knowledgeRepo: Repository<Knowledge>,
    @InjectRepository(AgentAction) private actionRepo: Repository<AgentAction>,
    @InjectRepository(NudgeTracking) private nudgeRepo: Repository<NudgeTracking>,
  ) {}

  async getKnowledge(term: string) {
    const entries = await this.knowledgeRepo.find({
      where: { term: ILike(`%${term}%`) },
      order: { created_at: 'DESC' },
    });

    if (entries.length === 0) {
      return { found: false, term, message: `No team corrections found for "${term}".` };
    }

    return {
      found: true,
      term,
      corrections: entries.map((e) => ({
        definition: e.definition,
        source_user: e.source_user,
        created_at: e.created_at,
      })),
    };
  }

  async storeKnowledge(term: string, definition: string, sourceUser: string) {
    const entry = this.knowledgeRepo.create({
      term,
      definition,
      source_user: sourceUser,
    });
    await this.knowledgeRepo.save(entry);
    return { stored: true, term, definition, source_user: sourceUser };
  }

  async logAction(data: {
    action_type: string;
    trigger: string;
    reasoning: string;
    tools_used: Record<string, unknown>[];
    message_sent: string | null;
  }) {
    const action = this.actionRepo.create(data);
    await this.actionRepo.save(action);
    return { logged: true, id: action.id };
  }

  async getRecentActions(limit = 20) {
    return this.actionRepo.find({
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  async getNudgeStatus(proposalId: number, memberAddress: string) {
    const nudge = await this.nudgeRepo.findOne({
      where: { proposal_id: proposalId, member_address: memberAddress },
      order: { sent_at: 'DESC' },
    });
    return nudge;
  }

  async recordNudge(proposalId: number, memberAddress: string, level: number) {
    const nudge = this.nudgeRepo.create({
      proposal_id: proposalId,
      member_address: memberAddress,
      nudge_level: level,
      sent_at: new Date(),
    });
    await this.nudgeRepo.save(nudge);
    return nudge;
  }
}
