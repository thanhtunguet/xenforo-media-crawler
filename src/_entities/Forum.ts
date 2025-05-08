import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Site } from './Site';
import { Thread } from './Thread';

@Index('Forum_pk_2', ['siteId', 'originalId'], { unique: true })
@Entity('Forum', {  })
export class Forum {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    name: 'id',
    comment: 'Primary ID of this forum',
  })
  id: number;

  @Column('bigint', {
    name: 'siteId',
    comment: 'ID of the site that this forum belongs to',
  })
  siteId: number;

  @Column('varchar', { name: 'name', nullable: true, length: 255 })
  name: string | null;

  @Column('bigint', {
    name: 'originalId',
    nullable: true,
    comment: 'The original id of this forum',
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

  @Column('varchar', {
    name: 'originalUrl',
    nullable: true,
    comment: 'The original URL of this forum',
    length: 255,
  })
  originalUrl: string | null;

  @ManyToOne(() => Site, (site) => site.forums, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn([{ name: 'siteId', referencedColumnName: 'id' }])
  site: Site;

  @OneToMany(() => Thread, (thread) => thread.forum)
  threads: Thread[];
}
