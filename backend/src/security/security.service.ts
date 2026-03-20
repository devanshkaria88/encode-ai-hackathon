import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { TokenTransfer } from './entities/token-transfer.entity.js';
import { Member } from '../governance/entities/member.entity.js';

@Injectable()
export class SecurityService {
  constructor(
    @InjectRepository(TokenTransfer)
    private transferRepo: Repository<TokenTransfer>,
    @InjectRepository(Member)
    private memberRepo: Repository<Member>,
  ) {}

  async getTokenTransfers(hoursBack = 48) {
    const since = new Date();
    since.setHours(since.getHours() - hoursBack);

    const transfers = await this.transferRepo.find({
      where: { timestamp: MoreThan(since) },
      order: { timestamp: 'DESC' },
    });

    return transfers.map((t) => ({
      from_address: t.from_address,
      to_address: t.to_address,
      amount: Number(t.amount),
      timestamp: t.timestamp,
    }));
  }

  async getWalletProfile(address: string) {
    const member = await this.memberRepo.findOne({ where: { address } });

    const sentTransfers = await this.transferRepo.find({
      where: { from_address: address },
      order: { timestamp: 'DESC' },
    });

    const receivedTransfers = await this.transferRepo.find({
      where: { to_address: address },
      order: { timestamp: 'DESC' },
    });

    const allTransfers = [...sentTransfers, ...receivedTransfers].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );

    const firstActivity = allTransfers.length
      ? allTransfers[allTransfers.length - 1].timestamp
      : null;

    const walletAgeDays = firstActivity
      ? Math.floor((Date.now() - firstActivity.getTime()) / 86400000)
      : 0;

    return {
      address,
      is_known_member: !!member,
      display_name: member?.display_name ?? null,
      token_balance: member ? Number(member.token_balance) : 0,
      join_date: member?.join_date ?? null,
      wallet_age_days: walletAgeDays,
      first_activity: firstActivity,
      total_transfers: allTransfers.length,
      sent_count: sentTransfers.length,
      received_count: receivedTransfers.length,
      total_sent: sentTransfers.reduce((s, t) => s + Number(t.amount), 0),
      total_received: receivedTransfers.reduce((s, t) => s + Number(t.amount), 0),
      recent_transfers: allTransfers.slice(0, 10).map((t) => ({
        from: t.from_address,
        to: t.to_address,
        amount: Number(t.amount),
        timestamp: t.timestamp,
      })),
    };
  }
}
