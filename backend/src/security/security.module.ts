import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenTransfer } from './entities/token-transfer.entity.js';
import { Member } from '../governance/entities/member.entity.js';
import { SecurityService } from './security.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([TokenTransfer, Member])],
  providers: [SecurityService],
  exports: [SecurityService],
})
export class SecurityModule {}
