import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventLog } from '../_entities/EventLog';
import { EventLogService } from './event-log.service';
import { EventLogController } from './event-log.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EventLog])],
  controllers: [EventLogController],
  providers: [EventLogService],
  exports: [EventLogService],
})
export class EventLogModule {}
