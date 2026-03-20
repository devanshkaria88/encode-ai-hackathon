import { Module } from '@nestjs/common';
import { DashboardGateway } from './dashboard.gateway.js';
import { DashboardController } from './dashboard.controller.js';
import { GovernanceModule } from '../governance/governance.module.js';
import { TreasuryModule } from '../treasury/treasury.module.js';

@Module({
  imports: [GovernanceModule, TreasuryModule],
  controllers: [DashboardController],
  providers: [DashboardGateway],
  exports: [DashboardGateway],
})
export class DashboardModule {}
