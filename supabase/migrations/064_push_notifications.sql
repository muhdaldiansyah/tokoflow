-- Migration 064: Push notification infrastructure
-- Add push_token column to profiles for Expo Push Token storage

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Index for quick token lookup when sending notifications
CREATE INDEX IF NOT EXISTS idx_profiles_push_token ON profiles(id) WHERE push_token IS NOT NULL;
