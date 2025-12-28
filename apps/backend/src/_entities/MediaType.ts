import { Column, Entity, Index } from 'typeorm';
import { MediaTypeCode } from '../common/enums';

@Index('MediaType_pk_2', ['code'], { unique: true })
@Entity('MediaType', {})
export class MediaType {
  @Column('bigint', { primary: true, name: 'id' })
  id: number;

  @Column('enum', {
    name: 'code',
    unique: true,
    enum: [MediaTypeCode.IMAGE, MediaTypeCode.VIDEO, MediaTypeCode.LINK],
  })
  code: MediaTypeCode;

  @Column('varchar', { name: 'name', length: 255 })
  name: string;
}
