// Job Type Enum
export enum JobType {
  SYNC_FORUMS = 'sync_forums',
  SYNC_FORUM_THREADS = 'sync_forum_threads',
  SYNC_ALL_FORUMS_AND_THREADS = 'sync_all_forums_and_threads',
  SYNC_THREAD_POSTS = 'sync_thread_posts',
  DOWNLOAD_THREAD_MEDIA = 'download_thread_media',
}

// Job Status Enum
export enum JobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

// Event Type Enum
export enum EventType {
  SITE_CREATED = 'site_created',
  SITE_UPDATED = 'site_updated',
  SITE_DELETED = 'site_deleted',
  SITES_SYNC = 'sites_sync',
  FORUM_CREATED = 'forum_created',
  FORUM_UPDATED = 'forum_updated',
  FORUM_DELETED = 'forum_deleted',
  THREAD_SYNC = 'thread_sync',
  POST_SYNC = 'post_sync',
  MEDIA_DOWNLOAD = 'media_download',
}

// Media Type Code Enum
export enum MediaTypeCode {
  IMAGE = 'image',
  VIDEO = 'video',
  LINK = 'link',
}

// Media Type Enum (numeric IDs)
export enum MediaTypeEnum {
  ALL = 0,
  IMAGE = 1,
  VIDEO = 2,
  LINK = 3,
}

// Media Sort By Enum
export enum MediaSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  FILENAME = 'filename',
}

// Sort Order Enum
export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}
