import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { XenforoCrawlerService } from 'src/xenforo_crawler/xenforo_crawler.service';
import {
  PaginatedResponseDto,
  PaginationDto,
  PaginationMeta,
} from '../common/dto/pagination.dto';
import { CreateSiteDto } from './dto/create-site.dto';
import { ForumResponseDto } from './dto/forum-response.dto';
import { SiteResponseDto } from './dto/site-response.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { SiteService } from './site.service';

@ApiTags('Sites')
@Controller('/api/sites')
@ApiExtraModels(SiteResponseDto, ForumResponseDto, PaginationMeta)
export class SiteController {
  constructor(
    private readonly siteService: SiteService,
    private readonly xenforoCrawlerService: XenforoCrawlerService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create site',
    description: 'Creates a new site with the provided configuration details',
    operationId: 'createSite',
  })
  @ApiResponse({
    status: 201,
    description: 'Site created successfully',
    type: SiteResponseDto,
  })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createSiteDto: CreateSiteDto): Promise<SiteResponseDto> {
    return this.siteService.create(createSiteDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all sites',
    description: 'Retrieves a paginated list of sites sorted by creation date',
    operationId: 'getAllSites',
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
    description: 'Sites retrieved successfully',
    content: {
      'application/json': {
        schema: {
          properties: {
            items: {
              type: 'array',
              items: { $ref: getSchemaPath(SiteResponseDto) },
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
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<PaginatedResponseDto<SiteResponseDto>> {
    const pagination = new PaginationDto();
    if (page) pagination.page = +page;
    if (limit) pagination.limit = +limit;
    return this.siteService.findAll(pagination);
  }

  @Get('count')
  @ApiOperation({
    summary: 'Get site count',
    description: 'Returns the total number of sites in the system',
    operationId: 'getSiteCount',
  })
  @ApiResponse({
    status: 200,
    description: 'Total site count',
    schema: {
      properties: {
        count: {
          type: 'number',
          description: 'Total number of sites',
        },
      },
    },
  })
  count(): Promise<{ count: number }> {
    return this.siteService.count();
  }

  @Get('forums/count')
  @ApiOperation({
    summary: 'Get forum count',
    description: 'Returns the total number of forums in the system',
    operationId: 'getForumCount',
  })
  @ApiResponse({
    status: 200,
    description: 'Total forum count',
    schema: {
      properties: {
        count: {
          type: 'number',
          description: 'Total number of forums',
        },
      },
    },
  })
  countForums(): Promise<{ count: number }> {
    return this.siteService.countForums();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get site by ID',
    description: 'Retrieves detailed information about a specific site',
    operationId: 'getSiteById',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the site to retrieve',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Site details retrieved successfully',
    type: SiteResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Site not found',
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<SiteResponseDto> {
    return this.siteService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update site',
    description:
      'Updates an existing site with the provided configuration details',
    operationId: 'updateSite',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the site to update',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Site updated successfully',
    type: SiteResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Site not found',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSiteDto: UpdateSiteDto,
  ): Promise<SiteResponseDto> {
    return this.siteService.update(id, updateSiteDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete site',
    description: 'Soft deletes a site and all its associated data',
    operationId: 'deleteSite',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the site to delete',
    type: Number,
  })
  @ApiResponse({
    status: 204,
    description: 'Site deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Site not found',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.siteService.remove(id);
  }

  @Get(':id/forums')
  @ApiOperation({
    summary: 'Get site forums',
    description:
      'Retrieves a paginated list of forums belonging to a specific site',
    operationId: 'getSiteForums',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the site to retrieve forums for',
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
    description: 'Site forums retrieved successfully',
    content: {
      'application/json': {
        schema: {
          properties: {
            items: {
              type: 'array',
              items: { $ref: getSchemaPath(ForumResponseDto) },
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
    description: 'Site not found',
  })
  getForums(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<PaginatedResponseDto<ForumResponseDto>> {
    const pagination = new PaginationDto();
    if (page) pagination.page = +page;
    if (limit) pagination.limit = +limit;
    return this.siteService.getForumsBySiteId(id, pagination);
  }
}
