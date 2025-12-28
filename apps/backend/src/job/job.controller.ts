import { Controller, Get, Post, Patch, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JobService } from './job.service';
import { JobGateway } from './job.gateway';
import { SyncJob, JobStatus } from '../_entities/SyncJob';

@ApiTags('Jobs')
@Controller('/api/jobs')
export class JobController {
  constructor(
    private readonly jobService: JobService,
    private readonly jobGateway: JobGateway,
  ) {}

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

  @Post(':id/start')
  @ApiOperation({
    summary: 'Start a job',
    description: 'Starts a pending job',
    operationId: 'startJob',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the job to start',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Job started successfully',
    type: SyncJob,
  })
  async start(@Param('id', ParseIntPipe) id: number): Promise<SyncJob> {
    const job = await this.jobService.start(id);
    this.jobGateway.emitJobUpdate({
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      totalItems: job.totalItems,
      processedItems: job.processedItems,
      currentStep: job.currentStep,
    });
    return job;
  }

  @Patch(':id/pause')
  @ApiOperation({
    summary: 'Pause a job',
    description: 'Pauses a running job',
    operationId: 'pauseJob',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the job to pause',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Job paused successfully',
    type: SyncJob,
  })
  async pause(@Param('id', ParseIntPipe) id: number): Promise<SyncJob> {
    const job = await this.jobService.pause(id);
    this.jobGateway.emitJobUpdate({
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      totalItems: job.totalItems,
      processedItems: job.processedItems,
      currentStep: job.currentStep,
    });
    return job;
  }

  @Patch(':id/resume')
  @ApiOperation({
    summary: 'Resume a job',
    description: 'Resumes a paused job',
    operationId: 'resumeJob',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the job to resume',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Job resumed successfully',
    type: SyncJob,
  })
  async resume(@Param('id', ParseIntPipe) id: number): Promise<SyncJob> {
    const job = await this.jobService.resume(id);
    this.jobGateway.emitJobUpdate({
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      totalItems: job.totalItems,
      processedItems: job.processedItems,
      currentStep: job.currentStep,
    });
    return job;
  }

  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'Cancel a job',
    description: 'Cancels a job',
    operationId: 'cancelJob',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the job to cancel',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Job cancelled successfully',
    type: SyncJob,
  })
  async cancel(@Param('id', ParseIntPipe) id: number): Promise<SyncJob> {
    const job = await this.jobService.cancel(id);
    this.jobGateway.emitJobUpdate({
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      totalItems: job.totalItems,
      processedItems: job.processedItems,
      currentStep: job.currentStep,
    });
    return job;
  }
}

