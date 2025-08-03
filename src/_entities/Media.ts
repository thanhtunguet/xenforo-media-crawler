import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Post } from './Post';
import type { MediaTypeEnum } from 'src/types/media_type';

@Index('Media_pk_2', ['postId', 'originalId'], { unique: true })
@Entity('Media', {})
export class Media {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: number;

  @Column('bigint', { name: 'postId' })
  postId: number;

  @Column('bigint', { name: 'mediaTypeId' })
  mediaTypeId: MediaTypeEnum;

  @Column('bigint', { name: 'originalId', nullable: true })
  originalId: string | null;

  @Column('varchar', { name: 'caption', nullable: true, length: 255 })
  caption: string | null;

  @Column('varchar', { name: 'url', nullable: true, length: 2048 })
  url: string | null;

  @Column('varchar', { name: 'thumbnailUrl', nullable: true, length: 2048 })
  thumbnailUrl: string | null;

  @Column('varchar', { name: 'filename', nullable: true, length: 255 })
  filename: string | null;

  @Column('tinyint', {
    name: 'isDownloaded',
    nullable: true,
    width: 1,
    default: () => "'0'",
  })
  isDownloaded: boolean | null;

  @Column('varchar', { name: 'localPath', nullable: true, length: 2048 })
  localPath: string | null;

  @Column('varchar', { name: 'mimeType', nullable: true, length: 255 })
  mimeType: string | null;

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

  @ManyToOne(() => Post, (post) => post.media, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn([{ name: 'postId', referencedColumnName: 'id' }])
  post: Post;
}
