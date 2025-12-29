-- Migration: Add lastSyncAt column to Thread table
-- This column tracks when posts were last synced for a thread

ALTER TABLE Thread
ADD COLUMN lastSyncAt datetime NULL
COMMENT 'Last time posts were synced for this thread';




