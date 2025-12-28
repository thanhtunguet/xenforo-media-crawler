import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventLog } from '../_entities/EventLog';
import { EventType } from '@xenforo-media-crawler/contracts';
import {
  PaginatedResponseDto,
  PaginationDto,
} from '../common/dto/pagination.dto';

@Injectable()
export class EventLogService {
  constructor(
    @InjectRepository(EventLog)
    private eventLogRepository: Repository<EventLog>,
  ) {}

  async findAll(
    pagination: PaginationDto = new PaginationDto(),
  ): Promise<PaginatedResponseDto<EventLog>> {
    const [eventLogs, totalItems] = await this.eventLogRepository.findAndCount(
      {
        skip: pagination.skip,
        take: pagination.limit,
        order: {
          createdAt: 'DESC',
        },
      },
    );

    const totalPages = Math.ceil(totalItems / pagination.limit);

    return new PaginatedResponseDto(eventLogs, {
      totalItems,
      itemsPerPage: pagination.limit,
      currentPage: pagination.page,
      totalPages,
    });
  }

  async logEvent(
    eventType: EventType,
    options?: {
      entityType?: string;
      entityId?: number;
      entityName?: string;
      description?: string;
      metadata?: Record<string, any>;
    },
  ): Promise<EventLog> {
    const eventLog = this.eventLogRepository.create({
      eventType,
      entityType: options?.entityType || null,
      entityId: options?.entityId || null,
      entityName: options?.entityName || null,
      description: options?.description || null,
      metadata: options?.metadata || null,
      createdAt: new Date(),
    });

    return await this.eventLogRepository.save(eventLog);
  }

  async logSiteCreated(siteId: number, siteName: string): Promise<EventLog> {
    return this.logEvent(EventType.SITE_CREATED, {
      entityType: 'Site',
      entityId: siteId,
      entityName: siteName,
      description: `Site "${siteName}" was created`,
    });
  }

  async logSiteUpdated(
    siteId: number,
    siteName: string,
    changes?: Record<string, any>,
  ): Promise<EventLog> {
    return this.logEvent(EventType.SITE_UPDATED, {
      entityType: 'Site',
      entityId: siteId,
      entityName: siteName,
      description: `Site "${siteName}" was updated`,
      metadata: changes ? { changes } : null,
    });
  }

  async logSiteDeleted(siteId: number, siteName: string): Promise<EventLog> {
    return this.logEvent(EventType.SITE_DELETED, {
      entityType: 'Site',
      entityId: siteId,
      entityName: siteName,
      description: `Site "${siteName}" was deleted`,
    });
  }

  async logSitesSync(siteId: number, siteName: string): Promise<EventLog> {
    return this.logEvent(EventType.SITES_SYNC, {
      entityType: 'Site',
      entityId: siteId,
      entityName: siteName,
      description: `Forums sync started for site "${siteName}"`,
    });
  }

  async logForumCreated(
    forumId: number,
    forumName: string,
    siteId?: number,
  ): Promise<EventLog> {
    return this.logEvent(EventType.FORUM_CREATED, {
      entityType: 'Forum',
      entityId: forumId,
      entityName: forumName,
      description: `Forum "${forumName}" was created`,
      metadata: siteId ? { siteId } : null,
    });
  }

  async logForumUpdated(
    forumId: number,
    forumName: string,
    changes?: Record<string, any>,
  ): Promise<EventLog> {
    return this.logEvent(EventType.FORUM_UPDATED, {
      entityType: 'Forum',
      entityId: forumId,
      entityName: forumName,
      description: `Forum "${forumName}" was updated`,
      metadata: changes ? { changes } : null,
    });
  }

  async logForumDeleted(
    forumId: number,
    forumName: string,
  ): Promise<EventLog> {
    return this.logEvent(EventType.FORUM_DELETED, {
      entityType: 'Forum',
      entityId: forumId,
      entityName: forumName,
      description: `Forum "${forumName}" was deleted`,
    });
  }

  async logThreadSync(
    threadId: number,
    threadName: string,
    siteId?: number,
    forumId?: number,
  ): Promise<EventLog> {
    return this.logEvent(EventType.THREAD_SYNC, {
      entityType: 'Thread',
      entityId: threadId,
      entityName: threadName,
      description: `Thread sync started for "${threadName}"`,
      metadata: { siteId, forumId },
    });
  }

  async logPostSync(
    threadId: number,
    threadName: string,
    postCount?: number,
  ): Promise<EventLog> {
    return this.logEvent(EventType.POST_SYNC, {
      entityType: 'Post',
      entityId: threadId,
      entityName: threadName,
      description: `Post sync completed for thread "${threadName}"`,
      metadata: postCount ? { postCount } : null,
    });
  }

  async logMediaDownload(
    threadId: number,
    threadName: string,
    stats?: {
      total: number;
      downloaded: number;
      failed: number;
      skipped: number;
    },
  ): Promise<EventLog> {
    return this.logEvent(EventType.MEDIA_DOWNLOAD, {
      entityType: 'Media',
      entityId: threadId,
      entityName: threadName,
      description: `Media download completed for thread "${threadName}"`,
      metadata: stats ? { stats } : null,
    });
  }
}

