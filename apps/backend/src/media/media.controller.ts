import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { resolve } from 'path';
import sharp from 'sharp';
import {
  MediaFilters,
  MediaService,
  MediaWithThreadDto,
} from './media.service';
import { MediaResponseDto } from './dto/media-response.dto';
import { MediaStatsDto } from './dto/media-stats.dto';
import {
  PaginatedResponseDto,
  PaginationDto,
} from '../common/dto/pagination.dto';
import { MediaSortBy, SortOrder } from '@xenforo-media-crawler/contracts';

@ApiTags('Media')
@Controller('/api/media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all media with pagination and filters',
    description:
      'Retrieves all media items across all threads with optional filtering and sorting',
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
    enum: MediaSortBy,
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort order',
    enum: SortOrder,
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
    @Query('sortBy') sortBy?: MediaSortBy,
    @Query('sortOrder') sortOrder?: SortOrder,
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
    description:
      'Returns the total number of media items with optional filtering',
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
    description:
      'Retrieves all media items (images, videos, links) for a specific thread',
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

  @Get(':id/file')
  @ApiOperation({
    summary: 'Serve downloaded media file',
    description:
      'Serves the downloaded media file from local storage if available, otherwise returns 404',
    operationId: 'serveMediaFile',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the media item',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Media file served successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Media not found or not downloaded',
  })
  async serveMediaFile(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ): Promise<void> {
    const media = await this.mediaService.findById(id);

    if (!media) {
      throw new NotFoundException(`Media with ID ${id} not found`);
    }

    if (!media.isDownloaded || !media.localPath) {
      throw new NotFoundException(`Media with ID ${id} is not downloaded`);
    }

    // Check if file exists
    const filePath = path.resolve(process.cwd(), media.localPath);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Media file not found at ${media.localPath}`);
    }

    // Set appropriate headers
    if (media.mimeType) {
      res.setHeader('Content-Type', media.mimeType);
    }
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${media.filename || 'media'}"`,
    );

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }

  @Get(':id/thumbnail')
  @ApiOperation({
    summary: 'Serve media thumbnail',
    description:
      'Serves a thumbnail of the media file. If downloaded, generates/serves from local storage. Otherwise returns 404',
    operationId: 'serveMediaThumbnail',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the media item',
    type: Number,
  })
  @ApiQuery({
    name: 'size',
    required: false,
    description: 'Thumbnail size in pixels (default: 200)',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Thumbnail served successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Media not found or not downloaded',
  })
  async serveMediaThumbnail(
    @Param('id', ParseIntPipe) id: number,
    @Query('size') size: number,
    @Res() res: Response,
  ): Promise<void> {
    const media = await this.mediaService.findById(id);

    if (!media) {
      throw new NotFoundException(`Media with ID ${id} not found`);
    }

    if (!media.isDownloaded || !media.localPath) {
      throw new NotFoundException(`Media with ID ${id} is not downloaded`);
    }

    const thumbnailSize = size ? Number(size) : 200;
    const imagePath = resolve(process.cwd(), media.localPath);

    if (!fs.existsSync(imagePath)) {
      throw new NotFoundException(`Media file not found at ${media.localPath}`);
    }

    // Extract filename and thread originalId from localPath
    // Format: downloads/thread-{originalId}/{filename}
    const pathParts = media.localPath.split('/');
    const filename = pathParts[pathParts.length - 1] || media.filename;
    const threadOriginalId = media.post?.thread?.originalId;

    if (!threadOriginalId) {
      throw new NotFoundException('Thread originalId not found');
    }

    const width = thumbnailSize;
    const height = thumbnailSize;
    const thumbnailPath = resolve(
      process.cwd(),
      `downloads/thread-${threadOriginalId}/thumbnails/${width}x${height}/${filename}`,
    );

    try {
      // Check if thumbnail already exists
      if (fs.existsSync(thumbnailPath)) {
        // Return existing thumbnail
        const thumbnailBuffer = fs.readFileSync(thumbnailPath);
        res.setHeader('Content-Type', 'image/jpeg');
        res.send(thumbnailBuffer);
        return;
      }

      // If thumbnail doesn't exist, create directory if needed
      const thumbnailDir = resolve(
        process.cwd(),
        `downloads/thread-${threadOriginalId}/thumbnails/`,
      );
      if (!fs.existsSync(thumbnailDir)) {
        fs.mkdirSync(thumbnailDir, { recursive: true });
      }

      // Generate thumbnail
      const thumbnailBuffer = await sharp(imagePath)
        .resize(width, height, { fit: 'outside' })
        .toBuffer();

      // Save thumbnail for future use
      const sizeDir = resolve(thumbnailDir, `${width}x${height}`);
      if (!fs.existsSync(sizeDir)) {
        fs.mkdirSync(sizeDir, { recursive: true });
      }
      fs.writeFileSync(thumbnailPath, thumbnailBuffer);

      // Return generated thumbnail
      res.setHeader('Content-Type', 'image/jpeg');
      res.send(thumbnailBuffer);
    } catch (error) {
      throw new NotFoundException(`Error generating thumbnail: ${error}`);
    }
  }
}
