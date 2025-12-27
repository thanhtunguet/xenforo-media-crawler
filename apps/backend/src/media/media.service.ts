import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Media } from '../_entities/Media';
import { MediaResponseDto } from './dto/media-response.dto';
import { MediaStatsDto } from './dto/media-stats.dto';
import { PaginatedResponseDto, PaginationDto } from '../common/dto/pagination.dto';

export interface MediaWithThreadDto extends MediaResponseDto {
  thread: {
    id: number;
    title: string;
    originalId: string | null;
  };
}

export interface MediaFilters {
  mediaTypeId?: number;
  isDownloaded?: boolean;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'filename';
  sortOrder?: 'ASC' | 'DESC';
}

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private mediaRepository: Repository<Media>,
  ) {}

  async findByThreadId(threadId: number): Promise<MediaResponseDto[]> {
    const mediaItems = await this.mediaRepository
      .createQueryBuilder('media')
      .innerJoin('media.post', 'post')
      .where('post.threadId = :threadId', { threadId })
      .andWhere('media.deletedAt IS NULL')
      .orderBy('media.createdAt', 'ASC')
      .getMany();

    return mediaItems.map((media) => this.mapToDto(media));
  }

  async findByThreadIdAndType(
    threadId: number,
    mediaTypeId: number,
  ): Promise<MediaResponseDto[]> {
    let query = this.mediaRepository
      .createQueryBuilder('media')
      .innerJoin('media.post', 'post')
      .where('post.threadId = :threadId', { threadId })
      .andWhere('media.deletedAt IS NULL');

    if (mediaTypeId !== 0) {
      query = query.andWhere('media.mediaTypeId = :mediaTypeId', {
        mediaTypeId,
      });
    }

    const mediaItems = await query.orderBy('media.createdAt', 'ASC').getMany();

    return mediaItems.map((media) => this.mapToDto(media));
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: MediaFilters,
  ): Promise<PaginatedResponseDto<MediaWithThreadDto>> {
    const queryBuilder = this.mediaRepository
      .createQueryBuilder('media')
      .innerJoin('media.post', 'post')
      .innerJoin('post.thread', 'thread')
      .select([
        'media',
        'post.threadId',
        'thread.id',
        'thread.name',
        'thread.originalId',
      ])
      .where('media.deletedAt IS NULL');

    // Apply filters
    if (filters) {
      if (filters.mediaTypeId && filters.mediaTypeId !== 0) {
        queryBuilder.andWhere('media.mediaTypeId = :mediaTypeId', {
          mediaTypeId: filters.mediaTypeId,
        });
      }

      if (filters.isDownloaded !== undefined) {
        queryBuilder.andWhere('media.isDownloaded = :isDownloaded', {
          isDownloaded: filters.isDownloaded,
        });
      }

      if (filters.search) {
        queryBuilder.andWhere(
          '(media.caption LIKE :search OR media.filename LIKE :search)',
          { search: `%${filters.search}%` },
        );
      }

      // Sorting
      const sortBy = filters.sortBy || 'createdAt';
      const sortOrder = filters.sortOrder || 'DESC';
      queryBuilder.orderBy(`media.${sortBy}`, sortOrder);
    } else {
      queryBuilder.orderBy('media.createdAt', 'DESC');
    }

    // Count total items
    const totalItems = await queryBuilder.getCount();

    // Apply pagination
    const items = await queryBuilder
      .skip(paginationDto.skip)
      .take(paginationDto.limit)
      .getMany();

    // Map to DTOs with thread info
    const itemsWithThread = items.map((media) => ({
      ...this.mapToDto(media),
      thread: {
        id: media.post.thread.id,
        title: media.post.thread.name || '',
        originalId: media.post.thread.originalId,
      },
    }));

    const totalPages = Math.ceil(totalItems / paginationDto.limit);

    return new PaginatedResponseDto<MediaWithThreadDto>(itemsWithThread, {
      totalItems,
      itemsPerPage: paginationDto.limit,
      currentPage: paginationDto.page,
      totalPages,
    });
  }

  async getStats(): Promise<MediaStatsDto> {
    const stats = await this.mediaRepository
      .createQueryBuilder('media')
      .select('COUNT(*)', 'totalMedia')
      .addSelect(
        'SUM(CASE WHEN media.mediaTypeId = 1 THEN 1 ELSE 0 END)',
        'totalImages',
      )
      .addSelect(
        'SUM(CASE WHEN media.mediaTypeId = 2 THEN 1 ELSE 0 END)',
        'totalVideos',
      )
      .addSelect(
        'SUM(CASE WHEN media.mediaTypeId = 3 THEN 1 ELSE 0 END)',
        'totalLinks',
      )
      .addSelect(
        'SUM(CASE WHEN media.isDownloaded = 1 THEN 1 ELSE 0 END)',
        'totalDownloaded',
      )
      .addSelect(
        'SUM(CASE WHEN media.isDownloaded = 0 OR media.isDownloaded IS NULL THEN 1 ELSE 0 END)',
        'totalNotDownloaded',
      )
      .where('media.deletedAt IS NULL')
      .getRawOne();

    const totalMedia = parseInt(stats.totalMedia) || 0;
    const totalDownloaded = parseInt(stats.totalDownloaded) || 0;
    const downloadRate =
      totalMedia > 0 ? Math.round((totalDownloaded / totalMedia) * 100) : 0;

    return {
      totalMedia,
      totalImages: parseInt(stats.totalImages) || 0,
      totalVideos: parseInt(stats.totalVideos) || 0,
      totalLinks: parseInt(stats.totalLinks) || 0,
      totalDownloaded,
      totalNotDownloaded: parseInt(stats.totalNotDownloaded) || 0,
      downloadRate,
    };
  }

  async count(mediaTypeId?: number): Promise<number> {
    const queryBuilder = this.mediaRepository
      .createQueryBuilder('media')
      .where('media.deletedAt IS NULL');

    if (mediaTypeId && mediaTypeId !== 0) {
      queryBuilder.andWhere('media.mediaTypeId = :mediaTypeId', {
        mediaTypeId,
      });
    }

    return await queryBuilder.getCount();
  }

  async findById(id: number): Promise<Media | null> {
    return await this.mediaRepository.findOne({
      where: { id, deletedAt: null },
      relations: ['post', 'post.thread'],
    });
  }

  private mapToDto(media: Media): MediaResponseDto {
    return {
      id: media.id,
      postId: media.postId,
      mediaTypeId: media.mediaTypeId,
      originalId: media.originalId,
      caption: media.caption,
      url: media.url,
      thumbnailUrl: media.thumbnailUrl,
      filename: media.filename,
      isDownloaded: media.isDownloaded,
      localPath: media.localPath,
      mimeType: media.mimeType,
      createdAt: media.createdAt,
      updatedAt: media.updatedAt,
    };
  }
}

