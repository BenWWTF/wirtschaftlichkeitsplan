-- Migration: Create export_schedules and export_history tables
-- Purpose: Support scheduled exports and export history tracking

-- Create export_schedules table
CREATE TABLE IF NOT EXISTS export_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Schedule configuration
  name TEXT NOT NULL,
  description TEXT,
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('daily', 'weekly', 'monthly')),
  schedule_time TIME NOT NULL DEFAULT '08:00:00',
  schedule_day INT CHECK (schedule_day >= 0 AND schedule_day <= 6),
  schedule_date INT CHECK (schedule_date >= 1 AND schedule_date <= 31),

  -- Report selection (stored as JSON array)
  selected_reports JSONB NOT NULL DEFAULT '["break_even","monthly_planning","expense_summary"]'::jsonb,

  -- Export format
  export_format TEXT NOT NULL DEFAULT 'pdf' CHECK (export_format IN ('pdf', 'xlsx', 'csv')),

  -- Delivery settings
  include_in_email BOOLEAN DEFAULT false,
  email_recipients TEXT[] DEFAULT ARRAY[]::TEXT[],
  storage_location TEXT DEFAULT 'local' CHECK (storage_location IN ('local', 'cloud')),

  -- Scheduling state
  is_active BOOLEAN DEFAULT true,
  last_exported_at TIMESTAMP,
  next_export_at TIMESTAMP,

  -- Tracking
  export_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  last_error TEXT,

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create export_history table
CREATE TABLE IF NOT EXISTS export_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Export information
  export_type TEXT NOT NULL,
  export_format TEXT NOT NULL CHECK (export_format IN ('pdf', 'xlsx', 'csv', 'zip')),

  -- File information
  file_name TEXT NOT NULL,
  file_size INT,
  file_path TEXT,
  storage_type TEXT DEFAULT 'local' CHECK (storage_type IN ('local', 'cloud')),

  -- Export metadata
  period_start DATE,
  period_end DATE,
  record_count INT,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,

  -- Associated schedule
  schedule_id UUID REFERENCES export_schedules(id) ON DELETE SET NULL,

  -- Delivery
  sent_via_email BOOLEAN DEFAULT false,
  email_recipients TEXT[],

  -- Data retention
  created_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP DEFAULT (now() + INTERVAL '30 days'),
  archived BOOLEAN DEFAULT false
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_export_schedules_user_id ON export_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_export_schedules_next_export ON export_schedules(next_export_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_export_schedules_active ON export_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_export_history_user_id ON export_history(user_id);
CREATE INDEX IF NOT EXISTS idx_export_history_created_at ON export_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_export_history_status ON export_history(status);
CREATE INDEX IF NOT EXISTS idx_export_history_schedule_id ON export_history(schedule_id);
CREATE INDEX IF NOT EXISTS idx_export_history_expires_at ON export_history(expires_at);

-- Enable RLS
ALTER TABLE export_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for export_schedules
CREATE POLICY "Users can view their own export schedules"
  ON export_schedules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create export schedules"
  ON export_schedules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own export schedules"
  ON export_schedules FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own export schedules"
  ON export_schedules FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for export_history
CREATE POLICY "Users can view their own export history"
  ON export_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create export history entries"
  ON export_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own export history"
  ON export_history FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own export history"
  ON export_history FOR DELETE USING (auth.uid() = user_id);

-- Trigger function
CREATE OR REPLACE FUNCTION update_export_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER export_schedules_updated_at_trigger
BEFORE UPDATE ON export_schedules FOR EACH ROW
EXECUTE FUNCTION update_export_schedules_updated_at();

-- Archive function
CREATE OR REPLACE FUNCTION archive_old_exports()
RETURNS void AS $$
BEGIN
  UPDATE export_history SET archived = true WHERE expires_at < now() AND archived = false;
  DELETE FROM export_history WHERE expires_at < (now() - INTERVAL '60 days') AND archived = true;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON export_schedules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON export_history TO authenticated;
GRANT EXECUTE ON FUNCTION archive_old_exports TO authenticated;
