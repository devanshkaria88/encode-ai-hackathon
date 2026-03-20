import { Controller, Get } from '@nestjs/common';
import { GovernanceService } from '../governance/governance.service.js';
import { TreasuryService } from '../treasury/treasury.service.js';

@Controller('api')
export class DashboardController {
  constructor(
    private governance: GovernanceService,
    private treasury: TreasuryService,
  ) {}

  @Get('health')
  async getHealth() {
    const [treasury, proposals] = await Promise.all([
      this.treasury.getTreasurySummary(),
      this.governance.getActiveProposals(),
    ]);
    return { treasury, proposals };
  }
}
