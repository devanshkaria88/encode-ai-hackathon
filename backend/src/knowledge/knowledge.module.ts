import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Knowledge } from './entities/knowledge.entity.js';
import { AgentAction } from './entities/agent-action.entity.js';
import { NudgeTracking } from './entities/nudge-tracking.entity.js';
import { KnowledgeService } from './knowledge.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Knowledge, AgentAction, NudgeTracking])],
  providers: [KnowledgeService],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}
