import { Module } from '@nestjs/common';
import { XenforoCrawlerService } from './xenforo_crawler.service';
import { XenforoCrawlerController } from './xenforo_crawler.controller';
import { XenforoClientService } from './xenforo_client.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Forum, Site, Thread } from 'src/_entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Forum, Site, Thread]), // Add your entities here
  ],
  providers: [XenforoClientService, XenforoCrawlerService],
  controllers: [XenforoCrawlerController],
  exports: [XenforoCrawlerService],
})
export class XenforoCrawlerModule {}
