import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TreasuryTransaction } from './entities/treasury-transaction.entity.js';
import { TreasuryBalance } from './entities/treasury-balance.entity.js';
import { TreasuryService } from './treasury.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([TreasuryTransaction, TreasuryBalance])],
  providers: [TreasuryService],
  exports: [TreasuryService],
})
export class TreasuryModule {}
