import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EventLogService } from './event-log.service';
import { EventLog } from '../_entities/EventLog';
import {
  PaginatedResponseDto,
  PaginationDto,
} from '../common/dto/pagination.dto';

@ApiTags('Event Logs')
@Controller('/api/event-logs')
export class EventLogController {
  constructor(private readonly eventLogService: EventLogService) {}

  @Get()
  @ApiOperation({
    summary: 'Get event logs',
    description:
      'Retrieves a paginated list of event logs sorted by creation date (most recent first)',
    operationId: 'getEventLogs',
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
    description: 'Event logs retrieved successfully',
  })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number = 50,
  ): Promise<PaginatedResponseDto<EventLog>> {
    const pagination = new PaginationDto();
    pagination.page = page;
    pagination.limit = limit;

    return this.eventLogService.findAll(pagination);
  }
}
