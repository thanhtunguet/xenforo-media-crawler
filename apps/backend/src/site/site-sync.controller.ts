import { Controller, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiParam, ApiTags, ApiOperation } from '@nestjs/swagger';
import { XenforoCrawlerService } from 'src/xenforo_crawler/xenforo_crawler.service';
import { ForumResponseDto } from './dto/forum-response.dto';
import { SiteService } from './site.service';
import { EventLogService } from '../event-log/event-log.service';

@ApiTags('Site sync')
@Controller('/api/sites')
export class SiteSyncController {
  constructor(
    private readonly siteService: SiteService,
    private readonly xenforoCrawlerService: XenforoCrawlerService,
    private readonly eventLogService: EventLogService,
  ) {}

  @Post(':id/sync')
  @ApiOperation({
    summary: 'Sync site forums',
    description: 'Synchronizes forums from a Xenforo site',
    operationId: 'syncSiteForums',
  })
  @ApiParam({
    name: 'id',
    description: 'Site ID',
    required: true,
    type: Number,
  })
  async syncForums(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ForumResponseDto[]> {
    const site = await this.siteService.findOne(id);
    
    // Log sites sync
    await this.eventLogService.logSitesSync(
      id,
      site.name || site.url,
    );
    
    return this.xenforoCrawlerService.listForums(id);
  }

  @Post(':id/sync/threads')
  @ApiOperation({
    summary: 'Sync all forums and threads',
    description:
      'Synchronizes all forums and their threads from a Xenforo site',
    operationId: 'syncAllForumsAndThreads',
  })
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
  @ApiOperation({
    summary: 'Sync forum threads',
    description: 'Synchronizes all threads from a specific forum',
    operationId: 'syncForumThreads',
  })
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
