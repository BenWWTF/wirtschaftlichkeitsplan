-- Add payment_processing_fee_percentage column to practice_settings table
ALTER TABLE public.practice_settings
ADD COLUMN payment_processing_fee_percentage DECIMAL(5, 2)
  NOT NULL DEFAULT 1.39
  CHECK (payment_processing_fee_percentage >= 0 AND payment_processing_fee_percentage <= 100);
