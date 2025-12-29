// Re-export shared enums from contracts library
export {
  JobStatus,
  MediaSortBy,
  SortOrder,
} from '@xenforo-media-crawler/contracts';

// Frontend-specific UI enums (not shared with backend)
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
