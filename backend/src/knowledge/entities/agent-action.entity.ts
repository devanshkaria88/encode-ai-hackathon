import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('agent_actions_log')
export class AgentAction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  action_type!: string;

  @Column({ type: 'text' })
  trigger!: string;

  @Column({ type: 'text' })
  reasoning!: string;

  @Column({ type: 'jsonb', default: [] })
  tools_used!: Record<string, unknown>[];

  @Column({ type: 'text', nullable: true })
  message_sent!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
