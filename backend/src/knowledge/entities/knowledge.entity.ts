import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('knowledge')
export class Knowledge {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  term!: string;

  @Column({ type: 'text' })
  definition!: string;

  @Column({ type: 'text' })
  source_user!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
