import { Module } from '@nestjs/common';
import { TriggerController } from './trigger.controller.js';
import { AgentModule } from '../agent/agent.module.js';
import { LuffaModule } from '../luffa/luffa.module.js';

@Module({
  imports: [AgentModule, LuffaModule],
  controllers: [TriggerController],
})
export class TriggerModule {}
