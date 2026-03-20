import { Module, forwardRef } from '@nestjs/common';
import { AgentService } from './agent.service.js';
import { GovernanceModule } from '../governance/governance.module.js';
import { TreasuryModule } from '../treasury/treasury.module.js';
import { SecurityModule } from '../security/security.module.js';
import { KnowledgeModule } from '../knowledge/knowledge.module.js';
import { ChartModule } from '../chart/chart.module.js';
import { LuffaModule } from '../luffa/luffa.module.js';
import { DashboardModule } from '../dashboard/dashboard.module.js';

@Module({
  imports: [
    GovernanceModule,
    TreasuryModule,
    SecurityModule,
    KnowledgeModule,
    ChartModule,
    forwardRef(() => LuffaModule),
    DashboardModule,
  ],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}
