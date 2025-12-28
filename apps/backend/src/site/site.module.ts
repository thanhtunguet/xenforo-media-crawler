import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteController } from './site.controller';
import { SiteService } from './site.service';
import { Site } from '../_entities/Site';
import { Forum } from '../_entities/Forum';
import { XenforoCrawlerModule } from 'src/xenforo_crawler/xenforo_crawler.module';
import { SiteSyncController } from './site-sync.controller';
import { EventLogModule } from '../event-log/event-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Site, Forum]),
    XenforoCrawlerModule,
    EventLogModule,
  ],
  controllers: [SiteController, SiteSyncController],
  providers: [SiteService],
  exports: [SiteService],
})
export class SiteModule {}
