import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MediaService, MediaWithThreadDto, MediaFilters } from './media.service';
import { MediaResponseDto } from './dto/media-response.dto';
import { MediaStatsDto } from './dto/media-stats.dto';
import { PaginatedResponseDto, PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Media')
@Controller('/api/media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all media with pagination and filters',
    description: 'Retrieves all media items across all threads with optional filtering and sorting',
    operationId: 'getAllMedia',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (starting from 1)',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
    type: Number,
  })
  @ApiQuery({
    name: 'mediaTypeId',
    required: false,
    description: 'Filter by media type (0=all, 1=image, 2=video, 3=link)',
    type: Number,
  })
  @ApiQuery({
    name: 'isDownloaded',
    required: false,
    description: 'Filter by download status',
    type: Boolean,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in caption or filename',
    type: String,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Sort by field',
    enum: ['createdAt', 'updatedAt', 'filename'],
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
  })
  @ApiResponse({
    status: 200,
    description: 'Media items retrieved successfully',
  })
  async getAllMedia(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('mediaTypeId') mediaTypeId?: number,
    @Query('isDownloaded') isDownloaded?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: 'createdAt' | 'updatedAt' | 'filename',
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ): Promise<PaginatedResponseDto<MediaWithThreadDto>> {
    const paginationDto = new PaginationDto();
    paginationDto.page = page ? Number(page) : 1;
    paginationDto.limit = limit ? Number(limit) : 24;

    const filters: MediaFilters = {};
    if (mediaTypeId !== undefined) {
      filters.mediaTypeId = Number(mediaTypeId);
    }
    if (isDownloaded !== undefined) {
      filters.isDownloaded = isDownloaded === 'true' || isDownloaded === '1';
    }
    if (search) {
      filters.search = search;
    }
    if (sortBy) {
      filters.sortBy = sortBy;
    }
    if (sortOrder) {
      filters.sortOrder = sortOrder;
    }

    return this.mediaService.findAll(paginationDto, filters);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get media statistics',
    description: 'Retrieves aggregated statistics about all media items',
    operationId: 'getMediaStats',
  })
  @ApiResponse({
    status: 200,
    description: 'Media statistics retrieved successfully',
    type: MediaStatsDto,
  })
  async getStats(): Promise<MediaStatsDto> {
    return this.mediaService.getStats();
  }

  @Get('count')
  @ApiOperation({
    summary: 'Get media count',
    description: 'Returns the total number of media items with optional filtering',
    operationId: 'getMediaCount',
  })
  @ApiQuery({
    name: 'mediaTypeId',
    required: false,
    description: 'Filter by media type (0=all, 1=image, 2=video, 3=link)',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Media count retrieved successfully',
  })
  async getCount(
    @Query('mediaTypeId') mediaTypeId?: number,
  ): Promise<{ count: number }> {
    const typeId = mediaTypeId !== undefined ? Number(mediaTypeId) : undefined;
    const count = await this.mediaService.count(typeId);
    return { count };
  }

  @Get('thread/:threadId')
  @ApiOperation({
    summary: 'Get media for a thread',
    description: 'Retrieves all media items (images, videos, links) for a specific thread',
    operationId: 'getThreadMedia',
  })
  @ApiParam({
    name: 'threadId',
    description: 'The ID of the thread',
    type: Number,
  })
  @ApiQuery({
    name: 'mediaTypeId',
    required: false,
    description: 'Filter by media type (0=all, 1=image, 2=video, 3=link)',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Media items retrieved successfully',
    type: [MediaResponseDto],
  })
  async getThreadMedia(
    @Param('threadId', ParseIntPipe) threadId: number,
    @Query('mediaTypeId') mediaTypeId?: number,
  ): Promise<MediaResponseDto[]> {
    const typeId = mediaTypeId !== undefined ? Number(mediaTypeId) : 0;
    return this.mediaService.findByThreadIdAndType(threadId, typeId);
  }
}

