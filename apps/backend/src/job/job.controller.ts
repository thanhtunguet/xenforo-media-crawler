import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JobService } from './job.service';
import { SyncJob, JobStatus } from '../_entities/SyncJob';

@ApiTags('Jobs')
@Controller('/api/jobs')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all jobs',
    description: 'Retrieves a list of sync jobs',
    operationId: 'getAllJobs',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of jobs to return',
    type: Number,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by job status',
    enum: JobStatus,
  })
  @ApiResponse({
    status: 200,
    description: 'List of jobs retrieved successfully',
    type: [SyncJob],
  })
  async findAll(
    @Query('limit') limit?: number,
    @Query('status') status?: JobStatus,
  ): Promise<SyncJob[]> {
    const limitNum = limit ? Number(limit) : 50;
    return this.jobService.findAll(limitNum, status);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get job by ID',
    description: 'Retrieves detailed information about a specific job',
    operationId: 'getJobById',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the job to retrieve',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Job details retrieved successfully',
    type: SyncJob,
  })
  @ApiResponse({
    status: 404,
    description: 'Job not found',
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<SyncJob | null> {
    return this.jobService.findOne(id);
  }
}

