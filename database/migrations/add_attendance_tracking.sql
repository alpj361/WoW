-- Migration: Add Attendance Tracking System
-- Date: 2026-01-25
-- Description: Adds QR-based attendance tracking for hosted events

-- 1. Add attendance requirement field to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS requires_attendance_check BOOLEAN DEFAULT false;

-- 2. Add scanning metadata to attended_events table
ALTER TABLE attended_events 
ADD COLUMN IF NOT EXISTS scanned_by_host BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS scanned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS scanned_by_user_id UUID REFERENCES auth.users(id);

-- 3. Create user_qr_codes table for storing user QR data
CREATE TABLE IF NOT EXISTS user_qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  qr_code_data TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_qr_codes_user_id ON user_qr_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_qr_codes_qr_data ON user_qr_codes(qr_code_data);
CREATE INDEX IF NOT EXISTS idx_attended_events_scanned_by ON attended_events(scanned_by_user_id);
CREATE INDEX IF NOT EXISTS idx_events_requires_attendance ON events(requires_attendance_check);

-- 5. Add RLS policies for user_qr_codes
ALTER TABLE user_qr_codes ENABLE ROW LEVEL SECURITY;

-- Users can view their own QR code
CREATE POLICY "Users can view own QR code"
  ON user_qr_codes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own QR code (auto-generated)
CREATE POLICY "Users can insert own QR code"
  ON user_qr_codes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Event hosts can view QR codes of attendees
CREATE POLICY "Event hosts can view attendee QR codes"
  ON user_qr_codes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e
      INNER JOIN saved_events se ON se.event_id = e.id
      WHERE e.user_id = auth.uid()
      AND se.user_id = user_qr_codes.user_id
    )
  );

-- 6. Create function to auto-generate QR code on user creation
CREATE OR REPLACE FUNCTION generate_user_qr_code()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_qr_codes (user_id, qr_code_data)
  VALUES (NEW.id, 'WOW-USER-' || NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create trigger to auto-generate QR on profile creation
DROP TRIGGER IF EXISTS on_profile_created_generate_qr ON profiles;
CREATE TRIGGER on_profile_created_generate_qr
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_user_qr_code();

-- 8. Backfill QR codes for existing users
INSERT INTO user_qr_codes (user_id, qr_code_data)
SELECT id, 'WOW-USER-' || id
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM user_qr_codes WHERE user_qr_codes.user_id = auth.users.id
)
ON CONFLICT (user_id) DO NOTHING;

-- 9. Add comment to document the schema changes
COMMENT ON COLUMN events.requires_attendance_check IS 'If true, attendees must be scanned by host to mark attendance';
COMMENT ON COLUMN attended_events.scanned_by_host IS 'True if attendance was marked by host QR scan';
COMMENT ON COLUMN attended_events.scanned_at IS 'Timestamp when QR was scanned by host';
COMMENT ON COLUMN attended_events.scanned_by_user_id IS 'User ID of the host who scanned the QR';
COMMENT ON TABLE user_qr_codes IS 'Stores unique QR code data for each user for attendance tracking';
