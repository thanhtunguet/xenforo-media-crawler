import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum JobType {
  SYNC_FORUMS = 'sync_forums',
  SYNC_FORUM_THREADS = 'sync_forum_threads',
  SYNC_ALL_FORUMS_AND_THREADS = 'sync_all_forums_and_threads',
  SYNC_THREAD_POSTS = 'sync_thread_posts',
  DOWNLOAD_THREAD_MEDIA = 'download_thread_media',
}

export enum JobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Index('SyncJob_status_idx', ['status'])
@Index('SyncJob_createdAt_idx', ['createdAt'])
@Entity('SyncJob', {})
export class SyncJob {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: number;

  @Column('varchar', {
    name: 'jobType',
    length: 50,
    comment: 'Type of sync job',
  })
  jobType: JobType;

  @Column('varchar', {
    name: 'status',
    length: 20,
    default: JobStatus.PENDING,
    comment: 'Current status of the job',
  })
  status: JobStatus;

  @Column('bigint', {
    name: 'siteId',
    nullable: true,
    comment: 'ID of the site being synced',
  })
  siteId: number | null;

  @Column('bigint', {
    name: 'forumId',
    nullable: true,
    comment: 'ID of the forum being synced',
  })
  forumId: number | null;

  @Column('bigint', {
    name: 'threadId',
    nullable: true,
    comment: 'ID of the thread being synced',
  })
  threadId: number | null;

  @Column('varchar', {
    name: 'entityName',
    nullable: true,
    length: 255,
    comment: 'Name of the entity being synced',
  })
  entityName: string | null;

  @Column('int', {
    name: 'progress',
    default: 0,
    comment: 'Progress percentage (0-100)',
  })
  progress: number;

  @Column('int', {
    name: 'totalItems',
    nullable: true,
    comment: 'Total number of items to process',
  })
  totalItems: number | null;

  @Column('int', {
    name: 'processedItems',
    default: 0,
    comment: 'Number of items processed',
  })
  processedItems: number;

  @Column('text', {
    name: 'currentStep',
    nullable: true,
    comment: 'Current step description',
  })
  currentStep: string | null;

  @Column('text', {
    name: 'errorMessage',
    nullable: true,
    comment: 'Error message if job failed',
  })
  errorMessage: string | null;

  @Column('json', {
    name: 'metadata',
    nullable: true,
    comment: 'Additional metadata about the job',
  })
  metadata: Record<string, any> | null;

  @Column('datetime', {
    name: 'createdAt',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date | null;

  @Column('datetime', {
    name: 'updatedAt',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date | null;

  @Column('datetime', {
    name: 'completedAt',
    nullable: true,
    comment: 'When the job was completed',
  })
  completedAt: Date | null;
}

