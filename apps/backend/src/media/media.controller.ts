import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MediaService } from './media.service';
import { MediaResponseDto } from './dto/media-response.dto';

@ApiTags('Media')
@Controller('/api/media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

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

