import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EventType } from '@xenforo-media-crawler/contracts';

// Re-export for backward compatibility
export { EventType };

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

