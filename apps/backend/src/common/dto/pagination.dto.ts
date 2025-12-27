import { ApiProperty, ApiExtraModels } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class PaginationMeta {
  @ApiProperty({
    description: 'Total number of items available',
  })
  totalItems: number;

  @ApiProperty({
    description: 'Number of items per page',
  })
  itemsPerPage: number;

  @ApiProperty({
    description: 'Current page number',
  })
  currentPage: number;

  @ApiProperty({
    description: 'Total number of pages',
  })
  totalPages: number;
}

@ApiExtraModels(PaginationMeta)
export class PaginationDto {
  @ApiProperty({
    description: 'Page number (starting from 1)',
    default: 1,
    required: false,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    default: 10,
    required: false,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit: number = 10;

  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}

@ApiExtraModels(PaginationDto)
export class PaginatedResponseDto<T> {
  items: T[];
  meta: PaginationMeta;

  constructor(items: T[], meta: PaginationMeta) {
    this.items = items;
    this.meta = meta;
  }
}
