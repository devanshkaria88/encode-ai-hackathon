import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proposal } from './entities/proposal.entity.js';
import { Vote } from './entities/vote.entity.js';
import { Member } from './entities/member.entity.js';

@Injectable()
export class GovernanceService {
  constructor(
    @InjectRepository(Proposal) private proposalRepo: Repository<Proposal>,
    @InjectRepository(Vote) private voteRepo: Repository<Vote>,
    @InjectRepository(Member) private memberRepo: Repository<Member>,
  ) {}

  async getActiveProposals() {
    const proposals = await this.proposalRepo.find({
      where: { status: 'active' },
      order: { vote_end: 'ASC' },
    });

    const totalMembers = await this.memberRepo.count();

    const results = [];
    for (const p of proposals) {
      const votes = await this.voteRepo.find({ where: { proposal_id: p.id } });
      const forVotes = votes.filter((v) => v.vote === 'for');
      const againstVotes = votes.filter((v) => v.vote === 'against');
      const abstainVotes = votes.filter((v) => v.vote === 'abstain');

      results.push({
        proposal_number: p.proposal_number,
        title: p.title,
        status: p.status,
        requested_amount: Number(p.requested_amount),
        proposer_address: p.proposer_address,
        vote_start: p.vote_start,
        vote_end: p.vote_end,
        total_votes: votes.length,
        votes_for: forVotes.length,
        votes_against: againstVotes.length,
        votes_abstain: abstainVotes.length,
        voting_power_for: forVotes.reduce((s, v) => s + Number(v.voting_power), 0),
        voting_power_against: againstVotes.reduce((s, v) => s + Number(v.voting_power), 0),
        participation_rate: `${((votes.length / totalMembers) * 100).toFixed(1)}%`,
        total_eligible_voters: totalMembers,
      });
    }

    return results;
  }

  async getProposalDetail(proposalNumber: number) {
    const p = await this.proposalRepo.findOne({
      where: { proposal_number: proposalNumber },
    });
    if (!p) return { error: `Proposal #${proposalNumber} not found` };

    const votes = await this.voteRepo.find({ where: { proposal_id: p.id } });
    const totalMembers = await this.memberRepo.count();

    const forVotes = votes.filter((v) => v.vote === 'for');
    const againstVotes = votes.filter((v) => v.vote === 'against');

    return {
      proposal_number: p.proposal_number,
      title: p.title,
      body: p.body,
      status: p.status,
      proposer_address: p.proposer_address,
      requested_amount: Number(p.requested_amount),
      recipient_address: p.recipient_address,
      vote_start: p.vote_start,
      vote_end: p.vote_end,
      created_at: p.created_at,
      total_votes: votes.length,
      votes_for: forVotes.length,
      votes_against: againstVotes.length,
      voting_power_for: forVotes.reduce((s, v) => s + Number(v.voting_power), 0),
      voting_power_against: againstVotes.reduce((s, v) => s + Number(v.voting_power), 0),
      participation_rate: `${((votes.length / totalMembers) * 100).toFixed(1)}%`,
      total_eligible_voters: totalMembers,
    };
  }

  async getVotingStatus(proposalNumber: number) {
    const p = await this.proposalRepo.findOne({
      where: { proposal_number: proposalNumber },
    });
    if (!p) return { error: `Proposal #${proposalNumber} not found` };

    const votes = await this.voteRepo.find({ where: { proposal_id: p.id } });
    const members = await this.memberRepo.find();

    const voterAddresses = new Set(votes.map((v) => v.voter_address));
    const nonVoters = members
      .filter((m) => !voterAddresses.has(m.address))
      .map((m) => ({
        address: m.address,
        display_name: m.display_name,
        token_balance: Number(m.token_balance),
        luffa_user_id: m.luffa_user_id,
      }));

    const voters = votes.map((v) => {
      const member = members.find((m) => m.address === v.voter_address);
      return {
        address: v.voter_address,
        display_name: member?.display_name ?? 'Unknown',
        vote: v.vote,
        voting_power: Number(v.voting_power),
        voted_at: v.voted_at,
      };
    });

    const timeRemaining = p.vote_end.getTime() - Date.now();
    const totalDuration = p.vote_end.getTime() - p.vote_start.getTime();
    const timeElapsedPct = ((totalDuration - timeRemaining) / totalDuration) * 100;

    return {
      proposal_number: p.proposal_number,
      title: p.title,
      total_eligible: members.length,
      total_voted: votes.length,
      participation_rate: `${((votes.length / members.length) * 100).toFixed(1)}%`,
      time_remaining_hours: Math.max(0, Math.round(timeRemaining / 3600000)),
      time_elapsed_pct: `${Math.min(100, timeElapsedPct).toFixed(0)}%`,
      voters,
      non_voters: nonVoters,
    };
  }

  async getMemberVoteHistory(address: string) {
    const member = await this.memberRepo.findOne({ where: { address } });
    if (!member) return { error: `Member ${address} not found` };

    const votes = await this.voteRepo.find({
      where: { voter_address: address },
      order: { voted_at: 'DESC' },
    });

    const voteDetails = [];
    for (const v of votes) {
      const proposal = await this.proposalRepo.findOne({ where: { id: v.proposal_id } });
      voteDetails.push({
        proposal_number: proposal?.proposal_number,
        title: proposal?.title,
        vote: v.vote,
        voting_power: Number(v.voting_power),
        voted_at: v.voted_at,
        proposal_status: proposal?.status,
        requested_amount: Number(proposal?.requested_amount ?? 0),
      });
    }

    return {
      address: member.address,
      display_name: member.display_name,
      token_balance: Number(member.token_balance),
      join_date: member.join_date,
      luffa_user_id: member.luffa_user_id,
      total_proposals_voted: votes.length,
      voting_history: voteDetails,
    };
  }

  async getMembers() {
    const members = await this.memberRepo.find({ order: { token_balance: 'DESC' } });
    return members.map((m) => ({
      address: m.address,
      display_name: m.display_name,
      token_balance: Number(m.token_balance),
      join_date: m.join_date,
      luffa_user_id: m.luffa_user_id,
    }));
  }
}
