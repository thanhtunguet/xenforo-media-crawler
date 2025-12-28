import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Post } from './Post';
import { Forum } from './Forum';

@Index('Thread_pk_2', ['forumId', 'originalId'], { unique: true })
@Entity('Thread', {})
export class Thread {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: number;

  @Column('bigint', { name: 'forumId', nullable: true })
  forumId: string | null;

  @Column('bigint', {
    name: 'originalId',
    nullable: true,
    comment: 'The original ID of this thread',
  })
  originalId: string | null;

  @Column('varchar', {
    name: 'originalUrl',
    nullable: true,
    comment: 'The original URL of this thread',
    length: 255,
  })
  originalUrl: string | null;

  @Column('varchar', { name: 'name', nullable: true, length: 1024 })
  name: string | null;

  @Column('varchar', { name: 'lastMessage', nullable: true, length: 4000 })
  lastMessage: string | null;

  @Column('varchar', { name: 'description', nullable: true, length: 1024 })
  description: string | null;

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
  })
  updatedAt: Date | null;

  @Column('datetime', {
    name: 'lastSyncAt',
    nullable: true,
    comment: 'Last time posts were synced for this thread',
  })
  lastSyncAt: Date | null;

  @Column('datetime', { name: 'deletedAt', nullable: true })
  deletedAt?: Date | null;

  @OneToMany(() => Post, (post) => post.thread)
  posts?: Post[];

  @ManyToOne(() => Forum, (forum) => forum.threads, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn([{ name: 'forumId', referencedColumnName: 'id' }])
  forum?: Forum;
}
