export class ForumResponseDto {
  id?: number;
  siteId: number;
  name: string | null;
  originalId: string | null;
  originalUrl: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;

  constructor(partial: Partial<ForumResponseDto>) {
    Object.assign(this, partial);
  }
}
