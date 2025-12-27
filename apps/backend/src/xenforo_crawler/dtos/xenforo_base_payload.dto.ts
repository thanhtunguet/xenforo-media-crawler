import { ApiProperty } from '@nestjs/swagger';

export class XenforoBasePayloadDto {
  @ApiProperty({
    type: Number,
    description: 'The ID of the site',
  })
  siteId: number;

  @ApiProperty({
    type: String,
    description: 'The URL of the site',
  })
  siteUrl: string;
}
