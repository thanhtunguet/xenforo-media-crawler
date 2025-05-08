import { Controller, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { XenforoCrawlerService } from 'src/xenforo_crawler/xenforo_crawler.service';
import { ForumResponseDto } from './dto/forum-response.dto';
import { SiteService } from './site.service';

@ApiTags('Site sync')
@Controller('/api/sites')
export class SiteSyncController {
  constructor(
    private readonly siteService: SiteService,
    private readonly xenforoCrawlerService: XenforoCrawlerService,
  ) {}

  @Post(':id/sync')
  @ApiParam({
    name: 'id',
    description: 'Site ID',
    required: true,
    type: Number,
  })
  syncForums(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ForumResponseDto[]> {
    return this.xenforoCrawlerService.listForums(id);
  }

  @Post(':id/sync/threads')
  @ApiParam({
    name: 'id',
    description: 'Site ID',
    required: true,
    type: Number,
  })
  syncAllForumsAndThreads(@Param('id', ParseIntPipe) id: number): string {
    void this.xenforoCrawlerService.syncAllForumsAndThreads(id);
    return 'All forums and threads are being synced';
  }

  @Post(':id/forums/:forumId/sync')
  @ApiParam({
    name: 'id',
    description: 'Site ID',
    required: true,
    type: Number,
  })
  @ApiParam({
    name: 'forumId',
    description: 'Forum ID',
    required: true,
    type: Number,
  })
  syncThreads(
    @Param('id', ParseIntPipe) id: number,
    @Param('forumId', ParseIntPipe) forumId: number,
  ): string {
    void this.xenforoCrawlerService.syncAllThreads(id, forumId);
    return 'All threads are being synced';
  }
}
