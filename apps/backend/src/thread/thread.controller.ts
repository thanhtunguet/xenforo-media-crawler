import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ThreadService } from './thread.service';
import {
  CreateThreadDto,
  ThreadCountDto,
  ThreadDto,
  UpdateThreadDto,
} from './dto/thread.dto';
import { PostDto } from './dto/post.dto';
import {
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  PaginatedResponseDto,
  PaginationDto,
  PaginationMeta,
} from '../common/dto/pagination.dto';

@ApiTags('Threads')
@Controller('/api/threads')
@ApiExtraModels(ThreadDto, PostDto, PaginationMeta)
export class ThreadController {
  constructor(private readonly threadService: ThreadService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all threads',
    description:
      'Retrieves a paginated list of threads sorted by last updated date',
    operationId: 'getAllThreads',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (starts from 1)',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
    type: Number,
  })
  @ApiQuery({
    name: 'forumId',
    required: false,
    description: 'Filter by forum ID (system id)',
    type: Number,
  })
  @ApiQuery({
    name: 'originalId',
    required: false,
    description: 'Filter by original ID from XenForo site',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'List of threads retrieved successfully',
    content: {
      'application/json': {
        schema: {
          properties: {
            items: {
              type: 'array',
              items: { $ref: getSchemaPath(ThreadDto) },
            },
            meta: {
              type: 'object',
              properties: {
                totalItems: { type: 'number' },
                itemsPerPage: { type: 'number' },
                currentPage: { type: 'number' },
                totalPages: { type: 'number' },
              },
            },
          },
        },
      },
    },
  })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('forumId') forumId?: number,
    @Query('originalId') originalId?: string,
  ): Promise<PaginatedResponseDto<ThreadDto>> {
    const pagination = new PaginationDto();
    if (page) pagination.page = +page;
    if (limit) pagination.limit = +limit;
    const forumIdNum = forumId ? Number(forumId) : undefined;
    return this.threadService.findAll(pagination, forumIdNum, originalId);
  }

  @Get('count')
  @ApiOperation({
    summary: 'Get thread count',
    description: 'Returns the total number of threads in the system',
    operationId: 'getThreadCount',
  })
  @ApiResponse({
    status: 200,
    description: 'Total thread count',
    type: ThreadCountDto,
  })
  async count(): Promise<ThreadCountDto> {
    const count = await this.threadService.count();
    return { count };
  }

  @Get('search/original-id')
  @ApiOperation({
    summary: 'Search thread by original ID',
    description:
      'Searches for a thread by its original ID from the XenForo site',
    operationId: 'searchThreadByOriginalId',
  })
  @ApiQuery({
    name: 'originalId',
    required: true,
    description: 'The original ID of the thread to search for',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Thread found successfully',
    type: ThreadDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Thread not found',
  })
  async findByOriginalId(
    @Query('originalId') originalId: string,
  ): Promise<ThreadDto> {
    return this.threadService.findByOriginalId(originalId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get thread by ID',
    description: 'Retrieves detailed information about a specific thread',
    operationId: 'getThreadById',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the thread to retrieve',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Thread details retrieved successfully',
    type: ThreadDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Thread not found',
  })
  async findOne(@Param('id') id: string): Promise<ThreadDto> {
    return this.threadService.findOne(+id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create thread',
    description: 'Creates a new thread with the provided details',
    operationId: 'createThread',
  })
  @ApiResponse({
    status: 201,
    description: 'Thread created successfully',
    type: ThreadDto,
  })
  async create(@Body() createThreadDto: CreateThreadDto): Promise<ThreadDto> {
    return this.threadService.create(createThreadDto);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update thread',
    description: 'Updates an existing thread with the provided details',
    operationId: 'updateThread',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the thread to update',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Thread updated successfully',
    type: ThreadDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Thread not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateThreadDto: UpdateThreadDto,
  ): Promise<ThreadDto> {
    return this.threadService.update(+id, updateThreadDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete thread',
    description: 'Soft deletes a thread and its associated posts',
    operationId: 'deleteThread',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the thread to delete',
    type: Number,
  })
  @ApiResponse({
    status: 204,
    description: 'Thread deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Thread not found',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.threadService.remove(+id);
  }

  @Get(':id/posts')
  @ApiOperation({
    summary: 'Get thread posts',
    description: 'Retrieves a paginated list of posts for a specific thread',
    operationId: 'getThreadPosts',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the thread to retrieve posts for',
    type: Number,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (starts from 1)',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Thread posts retrieved successfully',
    content: {
      'application/json': {
        schema: {
          properties: {
            items: {
              type: 'array',
              items: { $ref: getSchemaPath(PostDto) },
            },
            meta: {
              type: 'object',
              properties: {
                totalItems: { type: 'number' },
                itemsPerPage: { type: 'number' },
                currentPage: { type: 'number' },
                totalPages: { type: 'number' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Thread not found',
  })
  async findThreadPosts(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<PaginatedResponseDto<PostDto>> {
    const pagination = new PaginationDto();
    if (page) pagination.page = +page;
    if (limit) pagination.limit = +limit;
    return this.threadService.findThreadPosts(+id, pagination);
  }
}
