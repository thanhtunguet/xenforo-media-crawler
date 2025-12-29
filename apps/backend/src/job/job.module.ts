import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncJob } from '../_entities/SyncJob';
import { JobService } from './job.service';
import { JobController } from './job.controller';
import { JobGateway } from './job.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([SyncJob])],
  providers: [JobService, JobGateway],
  controllers: [JobController],
  exports: [JobService, JobGateway],
})
export class JobModule {}
