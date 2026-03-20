import { Module, forwardRef } from '@nestjs/common';
import { LuffaService } from './luffa.service.js';
import { LuffaPollingService } from './luffa.polling.service.js';
import { AgentModule } from '../agent/agent.module.js';
import { DashboardModule } from '../dashboard/dashboard.module.js';

@Module({
  imports: [forwardRef(() => AgentModule), DashboardModule],
  providers: [LuffaService, LuffaPollingService],
  exports: [LuffaService],
})
export class LuffaModule {}
