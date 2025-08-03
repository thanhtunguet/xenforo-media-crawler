import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Media } from './Media';
import { Thread } from './Thread';

@Index('Post_pk_2', ['threadId', 'originalId'], { unique: true })
@Entity('Post', {})
export class Post {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: number;

  @Column('bigint', { name: 'threadId' })
  threadId: number;

  @Column('varchar', { name: 'username', nullable: true, length: 255 })
  username: string | null;

  @Column('bigint', { name: 'userId', nullable: true })
  userId: string | null;

  @Column('mediumtext', { name: 'content', nullable: true })
  content: string | null;

  @Column('bigint', { name: 'parentId', nullable: true })
  parentId: string | null;

  @Column('bigint', {
    name: 'originalId',
    nullable: true,
    comment: 'The original ID of this post',
  })
  originalId: string | null;

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

  @Column('datetime', { name: 'deletedAt', nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => Media, (media) => media.post)
  media: Media[];

  @ManyToOne(() => Thread, (thread) => thread.posts, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn([{ name: 'threadId', referencedColumnName: 'id' }])
  thread: Thread;
}
