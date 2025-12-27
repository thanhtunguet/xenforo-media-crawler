import { Column, Entity, Index } from 'typeorm';

@Index('MediaType_pk_2', ['code'], { unique: true })
@Entity('MediaType', {})
export class MediaType {
  @Column('bigint', { primary: true, name: 'id' })
  id: number;

  @Column('enum', {
    name: 'code',
    unique: true,
    enum: ['image', 'video', 'link'],
  })
  code: 'image' | 'video' | 'link';

  @Column('varchar', { name: 'name', length: 255 })
  name: string;
}
