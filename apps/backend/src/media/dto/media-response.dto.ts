export class MediaResponseDto {
  id: number;
  postId: number;
  mediaTypeId: number;
  originalId: string | null;
  caption: string | null;
  url: string | null;
  thumbnailUrl: string | null;
  filename: string | null;
  isDownloaded: boolean | null;
  localPath: string | null;
  mimeType: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

