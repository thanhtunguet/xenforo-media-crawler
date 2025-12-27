-- Migration: Add loginAdapter column to Site table
-- Date: 2025-12-28

ALTER TABLE Site
ADD COLUMN loginAdapter VARCHAR(50) NOT NULL DEFAULT 'xamvn-clone'
AFTER url;
