import { Controller, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiParam, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { XenforoCrawlerService } from 'src/xenforo_crawler/xenforo_crawler.service';
import { ForumResponseDto } from './dto/forum-response.dto';
import { SiteService } from './site.service';
import { EventLogService } from '../event-log/event-log.service';
import { JobService } from '../job/job.service';
import { JobType } from '../_entities/SyncJob';

@ApiTags('Site sync')
@Controller('/api/sites')
export class SiteSyncController {
  constructor(
    private readonly siteService: SiteService,
    private readonly xenforoCrawlerService: XenforoCrawlerService,
    private readonly eventLogService: EventLogService,
    private readonly jobService: JobService,
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
  @ApiResponse({
    status: 200,
    description: 'Sync job started',
    schema: {
      type: 'object',
      properties: {
        jobId: { type: 'number' },
        message: { type: 'string' },
      },
    },
  })
  async syncAllForumsAndThreads(@Param('id', ParseIntPipe) id: number): Promise<{ jobId: number; message: string }> {
    const site = await this.siteService.findOne(id);
    const job = await this.jobService.create({
      jobType: JobType.SYNC_ALL_FORUMS_AND_THREADS,
      siteId: id,
      entityName: site.name || site.url,
    });
    
    // Run sync asynchronously
    void this.xenforoCrawlerService.syncAllForumsAndThreads(id, job.id);
    
    return {
      jobId: job.id,
      message: 'All forums and threads are being synced',
    };
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
  @ApiResponse({
    status: 200,
    description: 'Sync job started',
    schema: {
      type: 'object',
      properties: {
        jobId: { type: 'number' },
        message: { type: 'string' },
      },
    },
  })
  async syncThreads(
    @Param('id', ParseIntPipe) id: number,
    @Param('forumId', ParseIntPipe) forumId: number,
  ): Promise<{ jobId: number; message: string }> {
    // Get forum name for job entity name
    const forums = await this.xenforoCrawlerService.listForums(id);
    const forum = forums.find(f => f.id === forumId);
    
    const job = await this.jobService.create({
      jobType: JobType.SYNC_FORUM_THREADS,
      siteId: id,
      forumId,
      entityName: forum?.name || `Forum ${forumId}`,
    });
    
    // Run sync asynchronously
    void this.xenforoCrawlerService.syncAllThreads(id, forumId, job.id);
    
    return {
      jobId: job.id,
      message: 'All threads are being synced',
    };
  }
}
