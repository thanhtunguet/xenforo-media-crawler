import { ApiProperty } from '@nestjs/swagger';

export class BaseSiteDto {
  @ApiProperty({
    type: Number,
  })
  id: number;
}
