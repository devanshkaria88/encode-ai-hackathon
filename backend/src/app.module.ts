import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { GovernanceModule } from './governance/governance.module.js';
import { TreasuryModule } from './treasury/treasury.module.js';
import { SecurityModule } from './security/security.module.js';
import { KnowledgeModule } from './knowledge/knowledge.module.js';
import { ChartModule } from './chart/chart.module.js';
import { LuffaModule } from './luffa/luffa.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { AgentModule } from './agent/agent.module.js';
import { TriggerModule } from './trigger/trigger.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_NAME', 'govmind'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    GovernanceModule,
    TreasuryModule,
    SecurityModule,
    KnowledgeModule,
    ChartModule,
    LuffaModule,
    DashboardModule,
    AgentModule,
    TriggerModule,
  ],
})
export class AppModule {}
