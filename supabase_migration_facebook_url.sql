-- Add facebook_url column to procesiones
ALTER TABLE procesiones ADD COLUMN IF NOT EXISTS facebook_url TEXT;
