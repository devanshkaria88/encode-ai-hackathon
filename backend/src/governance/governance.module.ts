import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proposal } from './entities/proposal.entity.js';
import { Vote } from './entities/vote.entity.js';
import { Member } from './entities/member.entity.js';
import { GovernanceService } from './governance.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Proposal, Vote, Member])],
  providers: [GovernanceService],
  exports: [GovernanceService],
})
export class GovernanceModule {}
