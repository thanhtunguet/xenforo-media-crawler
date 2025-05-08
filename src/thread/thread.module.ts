import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThreadController } from './thread.controller';
import { ThreadService } from './thread.service';
import { Thread } from '../_entities/Thread';
import { Post } from '../_entities/Post';

@Module({
  imports: [TypeOrmModule.forFeature([Thread, Post])],
  controllers: [ThreadController],
  providers: [ThreadService],
  exports: [ThreadService],
})
export class ThreadModule {}
