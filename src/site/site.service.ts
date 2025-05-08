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

@Injectable()
export class SiteService {
  constructor(
    @InjectRepository(Site)
    private siteRepository: Repository<Site>,
    @InjectRepository(Forum)
    private forumRepository: Repository<Forum>,
  ) {}

  async create(createSiteDto: CreateSiteDto): Promise<SiteResponseDto> {
    const site = this.siteRepository.create(createSiteDto);
    const savedSite = await this.siteRepository.save(site);
    return new SiteResponseDto(savedSite);
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

    return {
      items: sites.map((site) => new SiteResponseDto(site)),
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
    return new SiteResponseDto(site);
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
    return new SiteResponseDto(updatedSite);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.siteRepository.softDelete(id);
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
}
