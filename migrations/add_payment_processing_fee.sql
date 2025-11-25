-- Migration: Add Payment Processing Fee to Practice Settings
-- Description: Adds a payment_processing_fee_percentage column for SumUp card payment fee tracking
-- Created: 2024-11-22

-- Add the payment_processing_fee_percentage column to practice_settings
-- Default value 1.39% represents the standard SumUp transaction fee
ALTER TABLE public.practice_settings
ADD COLUMN IF NOT EXISTS payment_processing_fee_percentage NUMERIC NOT NULL DEFAULT 1.39
CONSTRAINT chk_payment_processing_fee_percentage CHECK (payment_processing_fee_percentage >= 0 AND payment_processing_fee_percentage <= 100);

-- Add a comment to document the column purpose
COMMENT ON COLUMN public.practice_settings.payment_processing_fee_percentage IS 'Percentage fee charged for card payment processing (e.g., SumUp). Default 1.39% represents standard SumUp transaction fee.';
