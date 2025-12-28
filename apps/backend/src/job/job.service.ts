import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SyncJob, JobType, JobStatus } from '../_entities/SyncJob';

export interface CreateJobDto {
  jobType: JobType;
  siteId?: number;
  forumId?: number;
  threadId?: number;
  entityName?: string;
  metadata?: Record<string, any>;
}

export interface UpdateJobProgressDto {
  progress?: number;
  totalItems?: number;
  processedItems?: number;
  currentStep?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class JobService {
  constructor(
    @InjectRepository(SyncJob)
    private readonly jobRepository: Repository<SyncJob>,
  ) {}

  async create(dto: CreateJobDto): Promise<SyncJob> {
    const job = this.jobRepository.create({
      ...dto,
      status: JobStatus.PENDING,
      progress: 0,
      processedItems: 0,
    });
    return this.jobRepository.save(job);
  }

  async findOne(id: number): Promise<SyncJob | null> {
    return this.jobRepository.findOne({ where: { id } });
  }

  async updateProgress(
    id: number,
    dto: UpdateJobProgressDto,
  ): Promise<SyncJob> {
    const job = await this.findOne(id);
    if (!job) {
      throw new Error(`Job with ID ${id} not found`);
    }

    Object.assign(job, dto);
    job.updatedAt = new Date();
    return this.jobRepository.save(job);
  }

  async start(id: number): Promise<SyncJob> {
    const job = await this.findOne(id);
    if (!job) {
      throw new Error(`Job with ID ${id} not found`);
    }

    job.status = JobStatus.RUNNING;
    job.updatedAt = new Date();
    return this.jobRepository.save(job);
  }

  async complete(id: number, metadata?: Record<string, any>): Promise<SyncJob> {
    const job = await this.findOne(id);
    if (!job) {
      throw new Error(`Job with ID ${id} not found`);
    }

    job.status = JobStatus.COMPLETED;
    job.progress = 100;
    job.completedAt = new Date();
    job.updatedAt = new Date();
    if (metadata) {
      job.metadata = { ...(job.metadata || {}), ...metadata };
    }
    return this.jobRepository.save(job);
  }

  async fail(id: number, errorMessage: string): Promise<SyncJob> {
    const job = await this.findOne(id);
    if (!job) {
      throw new Error(`Job with ID ${id} not found`);
    }

    job.status = JobStatus.FAILED;
    job.errorMessage = errorMessage;
    job.completedAt = new Date();
    job.updatedAt = new Date();
    return this.jobRepository.save(job);
  }

  async cancel(id: number): Promise<SyncJob> {
    const job = await this.findOne(id);
    if (!job) {
      throw new Error(`Job with ID ${id} not found`);
    }

    job.status = JobStatus.CANCELLED;
    job.completedAt = new Date();
    job.updatedAt = new Date();
    return this.jobRepository.save(job);
  }

  async findAll(
    limit = 50,
    status?: JobStatus,
  ): Promise<SyncJob[]> {
    const query = this.jobRepository.createQueryBuilder('job');
    if (status) {
      query.where('job.status = :status', { status });
    }
    query.orderBy('job.createdAt', 'DESC').limit(limit);
    return query.getMany();
  }
}

