import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { Site } from './Site';

@Unique('User_pk_2', ['siteId', 'username', 'email'])
@Entity('User', {})
export class User {
  @Column('bigint', { primary: true, name: 'id' })
  id: number;

  @Column('bigint', { name: 'siteId' })
  siteId: number;

  @Column('varchar', { name: 'username', nullable: true, length: 255 })
  username: string | null;

  @Column('varchar', { name: 'name', nullable: true, length: 255 })
  name: string | null;

  @Column('varchar', { name: 'email', nullable: true, length: 255 })
  email: string | null;

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

  @ManyToOne(() => Site, (site) => site.users, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn([{ name: 'siteId', referencedColumnName: 'id' }])
  site: Site;
}
