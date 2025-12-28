// Job Status Enum
export enum JobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
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

// Badge Variant Enum
export enum BadgeVariant {
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  INFO = 'info',
  DEFAULT = 'default',
}

// Toast Type Enum
export enum ToastType {
  SUCCESS = 'success',
  ERROR = 'error',
  INFO = 'info',
  WARNING = 'warning',
}

// Button Variant Enum
export enum ButtonVariant {
  DEFAULT = 'default',
  DESTRUCTIVE = 'destructive',
  OUTLINE = 'outline',
  SECONDARY = 'secondary',
  GHOST = 'ghost',
  LINK = 'link',
  GLASS = 'glass',
  GLASS_PRIMARY = 'glass-primary',
  GLASS_DANGER = 'glass-danger',
}

// Button Size Enum
export enum ButtonSize {
  DEFAULT = 'default',
  SM = 'sm',
  LG = 'lg',
  ICON = 'icon',
}

// Progress Status Enum
export enum ProgressStatus {
  SYNCING = 'syncing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// Glass Card Variant Enum
export enum GlassCardVariant {
  DEFAULT = 'default',
  HOVER_GLOW = 'hover-glow',
  BORDERED = 'bordered',
}

