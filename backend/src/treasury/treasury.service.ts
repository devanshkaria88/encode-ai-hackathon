import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { TreasuryTransaction } from './entities/treasury-transaction.entity.js';
import { TreasuryBalance } from './entities/treasury-balance.entity.js';

@Injectable()
export class TreasuryService {
  constructor(
    @InjectRepository(TreasuryTransaction)
    private txRepo: Repository<TreasuryTransaction>,
    @InjectRepository(TreasuryBalance)
    private balanceRepo: Repository<TreasuryBalance>,
  ) {}

  async getTreasurySummary() {
    const balances = await this.balanceRepo.find();
    const totalEth = balances.reduce((s, b) => s + Number(b.balance), 0);
    const totalUsd = balances.reduce((s, b) => s + Number(b.usd_value), 0);

    const burnRate = await this.getBurnRate();
    const runway = burnRate > 0 ? totalEth / burnRate : Infinity;

    return {
      total_balance_eth: Number(totalEth.toFixed(2)),
      total_balance_usd: Number(totalUsd.toFixed(2)),
      allocations: balances.map((b) => ({
        token: b.token,
        balance: Number(b.balance),
        usd_value: Number(b.usd_value),
        percentage: Number(b.percentage),
      })),
      monthly_burn_rate_eth: Number(burnRate.toFixed(2)),
      runway_months: Number(runway.toFixed(1)),
      concentration_risk: this.assessConcentration(balances),
    };
  }

  async getBurnRate(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const outflows = await this.txRepo.find({
      where: {
        direction: 'outflow' as const,
        timestamp: MoreThan(thirtyDaysAgo),
      },
    });

    return outflows.reduce((sum, tx) => sum + Number(tx.amount), 0);
  }

  async getRunway(): Promise<{ runway_months: number; burn_rate_eth: number; total_eth: number }> {
    const balances = await this.balanceRepo.find();
    const totalEth = balances.reduce((s, b) => s + Number(b.balance), 0);
    const burnRate = await this.getBurnRate();
    return {
      runway_months: burnRate > 0 ? Number((totalEth / burnRate).toFixed(1)) : Infinity,
      burn_rate_eth: Number(burnRate.toFixed(2)),
      total_eth: Number(totalEth.toFixed(2)),
    };
  }

  async getTransactions(options?: {
    direction?: 'inflow' | 'outflow';
    category?: string;
    limit?: number;
    daysBack?: number;
  }) {
    const qb = this.txRepo.createQueryBuilder('tx');

    if (options?.direction) {
      qb.andWhere('tx.direction = :dir', { dir: options.direction });
    }
    if (options?.category) {
      qb.andWhere('tx.category = :cat', { cat: options.category });
    }
    if (options?.daysBack) {
      const since = new Date();
      since.setDate(since.getDate() - options.daysBack);
      qb.andWhere('tx.timestamp > :since', { since });
    }

    qb.orderBy('tx.timestamp', 'DESC');
    if (options?.limit) qb.take(options.limit);

    const txs = await qb.getMany();
    return txs.map((tx) => ({
      tx_hash: tx.tx_hash,
      direction: tx.direction,
      amount: Number(tx.amount),
      token: tx.token,
      counterparty: tx.counterparty,
      category: tx.category,
      memo: tx.memo,
      timestamp: tx.timestamp,
    }));
  }

  private assessConcentration(
    balances: TreasuryBalance[],
  ): { risk_level: string; details: string } {
    const total = balances.reduce((s, b) => s + Number(b.usd_value), 0);
    if (total === 0) return { risk_level: 'unknown', details: 'No treasury data' };

    const maxPct = Math.max(...balances.map((b) => Number(b.percentage)));
    const dominant = balances.find((b) => Number(b.percentage) === maxPct);

    if (maxPct >= 80) {
      return {
        risk_level: 'HIGH',
        details: `${maxPct}% concentrated in ${dominant?.token}. A 30% price drop would reduce runway significantly.`,
      };
    }
    if (maxPct >= 60) {
      return {
        risk_level: 'MEDIUM',
        details: `${maxPct}% in ${dominant?.token}. Some diversification recommended.`,
      };
    }
    return { risk_level: 'LOW', details: 'Treasury is reasonably diversified.' };
  }
}
