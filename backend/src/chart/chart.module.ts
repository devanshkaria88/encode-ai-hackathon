import { Module } from '@nestjs/common';
import { ChartService } from './chart.service.js';

@Module({
  providers: [ChartService],
  exports: [ChartService],
})
export class ChartModule {}
