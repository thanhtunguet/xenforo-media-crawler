export class MediaStatsDto {
  totalMedia: number;
  totalImages: number;
  totalVideos: number;
  totalLinks: number;
  totalDownloaded: number;
  totalNotDownloaded: number;
  downloadRate: number; // Percentage (0-100)
}
