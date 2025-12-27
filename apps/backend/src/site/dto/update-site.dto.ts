import { IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateSiteDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsUrl()
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  loginAdapter?: string;
}
