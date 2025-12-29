import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Forum } from '../_entities/Forum';
import { Site } from '../_entities/Site';
import {
  PaginatedResponseDto,
  PaginationDto,
} from '../common/dto/pagination.dto';
import { CreateSiteDto } from './dto/create-site.dto';
import { ForumResponseDto } from './dto/forum-response.dto';
import { SiteResponseDto } from './dto/site-response.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { EventLogService } from '../event-log/event-log.service';

@Injectable()
export class SiteService {
  constructor(
    @InjectRepository(Site)
    private siteRepository: Repository<Site>,
    @InjectRepository(Forum)
    private forumRepository: Repository<Forum>,
    private eventLogService: EventLogService,
  ) {}

  async create(createSiteDto: CreateSiteDto): Promise<SiteResponseDto> {
    const site = this.siteRepository.create(createSiteDto);
    const savedSite = await this.siteRepository.save(site);
    const siteDto = new SiteResponseDto(savedSite);
    siteDto.forumCount = 0; // New site has no forums

    // Log site creation
    await this.eventLogService.logSiteCreated(
      savedSite.id,
      savedSite.name || savedSite.url,
    );

    return siteDto;
  }

  async findAll(
    pagination: PaginationDto = new PaginationDto(),
  ): Promise<PaginatedResponseDto<SiteResponseDto>> {
    const [sites, totalItems] = await this.siteRepository.findAndCount({
      skip: pagination.skip,
      take: pagination.limit,
      order: {
        createdAt: 'DESC',
      },
    });

    const totalPages = Math.ceil(totalItems / pagination.limit);

    // Get forum counts for all sites in a single query
    const siteIds = sites.map((site) => site.id);
    const forumCountMap = new Map<number, number>();

    // Only query forum counts if there are sites
    if (siteIds.length > 0) {
      const forumCounts = await this.forumRepository
        .createQueryBuilder('forum')
        .select('forum.siteId', 'siteId')
        .addSelect('COUNT(forum.id)', 'count')
        .where('forum.siteId IN (:...siteIds)', { siteIds })
        .andWhere('forum.deletedAt IS NULL')
        .groupBy('forum.siteId')
        .getRawMany();

      // Create a map of siteId -> forumCount
      forumCounts.forEach((item) => {
        forumCountMap.set(item.siteId, parseInt(item.count, 10));
      });
    }

    return {
      items: sites.map((site) => {
        const siteDto = new SiteResponseDto(site);
        siteDto.forumCount = forumCountMap.get(site.id) || 0;
        return siteDto;
      }),
      meta: {
        totalItems,
        itemsPerPage: pagination.limit,
        currentPage: pagination.page,
        totalPages,
      },
    };
  }

  async count(): Promise<{ count: number }> {
    const count = await this.siteRepository.count();
    return { count };
  }

  async findOne(id: number): Promise<SiteResponseDto> {
    const site = await this.siteRepository.findOne({ where: { id } });
    if (!site) {
      throw new NotFoundException(`Site with ID ${id} not found`);
    }
    const forumCount = await this.forumRepository.count({
      where: {
        siteId: id,
        deletedAt: null,
      },
    });
    const siteDto = new SiteResponseDto(site);
    siteDto.forumCount = forumCount;
    return siteDto;
  }

  async update(
    id: number,
    updateSiteDto: UpdateSiteDto,
  ): Promise<SiteResponseDto> {
    const site = await this.findOne(id);
    const updatedSite = await this.siteRepository.save({
      ...site,
      ...updateSiteDto,
      updatedAt: new Date(),
    });
    // Get forum count for updated site
    const forumCount = await this.forumRepository.count({
      where: {
        siteId: id,
        deletedAt: null,
      },
    });
    const siteDto = new SiteResponseDto(updatedSite);
    siteDto.forumCount = forumCount;

    // Log site update
    await this.eventLogService.logSiteUpdated(
      updatedSite.id,
      updatedSite.name || updatedSite.url,
      updateSiteDto,
    );

    return siteDto;
  }

  async remove(id: number): Promise<void> {
    const site = await this.findOne(id);
    await this.siteRepository.softDelete(id);

    // Log site deletion
    await this.eventLogService.logSiteDeleted(id, site.name || site.url);
  }

  async getForumsBySiteId(
    siteId: number,
    pagination: PaginationDto = new PaginationDto(),
  ): Promise<PaginatedResponseDto<ForumResponseDto>> {
    // First, verify the site exists
    await this.findOne(siteId);

    // Get forums for the site with pagination
    const [forums, totalItems] = await this.forumRepository.findAndCount({
      where: {
        siteId,
        deletedAt: null,
      },
      order: {
        name: 'ASC',
      },
      skip: pagination.skip,
      take: pagination.limit,
    });

    const totalPages = Math.ceil(totalItems / pagination.limit);

    return {
      items: forums.map((forum) => new ForumResponseDto(forum)),
      meta: {
        totalItems,
        itemsPerPage: pagination.limit,
        currentPage: pagination.page,
        totalPages,
      },
    };
  }

  async countForums(): Promise<{ count: number }> {
    const count = await this.forumRepository.count({
      where: { deletedAt: null },
    });
    return { count };
  }
}
