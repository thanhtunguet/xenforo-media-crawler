export class SiteResponseDto {
  id: number;
  name: string | null;
  url: string;
  createdAt: Date | null;
  updatedAt: Date | null;

  constructor(partial: Partial<SiteResponseDto>) {
    Object.assign(this, partial);
  }
}
