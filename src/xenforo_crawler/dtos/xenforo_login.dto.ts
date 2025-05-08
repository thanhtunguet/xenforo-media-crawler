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
    type: String,
  })
  siteUrl: string;

  constructor(username: string, password: string, siteUrl: string) {
    this.username = username;
    this.password = password;
    this.siteUrl = siteUrl;
  }
}
