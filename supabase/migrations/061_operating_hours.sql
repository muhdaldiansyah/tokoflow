-- Migration 061: Operating hours for marketplace store pages
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS operating_hours JSONB;
