import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum EventType {
  SITE_CREATED = 'site_created',
  SITE_UPDATED = 'site_updated',
  SITE_DELETED = 'site_deleted',
  SITES_SYNC = 'sites_sync',
  FORUM_CREATED = 'forum_created',
  FORUM_UPDATED = 'forum_updated',
  FORUM_DELETED = 'forum_deleted',
  THREAD_SYNC = 'thread_sync',
  POST_SYNC = 'post_sync',
  MEDIA_DOWNLOAD = 'media_download',
}

@Index('EventLog_createdAt_idx', ['createdAt'])
@Entity('EventLog', {})
export class EventLog {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: number;

  @Column('varchar', {
    name: 'eventType',
    length: 50,
    comment: 'Type of event that occurred',
  })
  eventType: EventType;

  @Column('varchar', {
    name: 'entityType',
    nullable: true,
    length: 50,
    comment: 'Type of entity affected (e.g., Site, Forum, Thread)',
  })
  entityType: string | null;

  @Column('bigint', {
    name: 'entityId',
    nullable: true,
    comment: 'ID of the entity affected',
  })
  entityId: number | null;

  @Column('varchar', {
    name: 'entityName',
    nullable: true,
    length: 255,
    comment: 'Name or identifier of the entity affected',
  })
  entityName: string | null;

  @Column('text', {
    name: 'description',
    nullable: true,
    comment: 'Additional details about the event',
  })
  description: string | null;

  @Column('json', {
    name: 'metadata',
    nullable: true,
    comment: 'Additional metadata about the event in JSON format',
  })
  metadata: Record<string, any> | null;

  @Column('datetime', {
    name: 'createdAt',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date | null;
}

