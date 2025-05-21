import { ApiProperty } from '@nestjs/swagger';

export class XenforoLoginDto {
  @ApiProperty({
    type: String,
  })
  username: string;

  @ApiProperty({
    type: String,
  })
  password: string;

  @ApiProperty({
    type: Number,
  })
  siteId: number;

  constructor(username: string, password: string, siteId: number) {
    this.username = username;
    this.password = password;
    this.siteId = siteId;
  }
}
