import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateSiteDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsOptional()
  loginAdapter?: string;
}
