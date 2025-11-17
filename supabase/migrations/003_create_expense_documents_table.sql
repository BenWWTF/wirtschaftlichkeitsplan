-- Table: expense_documents
-- Stores document attachments (receipts, invoices, bill images) for expenses
CREATE TABLE IF NOT EXISTS public.expense_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL CHECK (file_size > 0),
  file_type TEXT NOT NULL,
  storage_bucket TEXT NOT NULL DEFAULT 'expense-documents',
  extracted_text TEXT,
  upload_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_expense_documents_user_id ON public.expense_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_documents_expense_id ON public.expense_documents(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_documents_upload_date ON public.expense_documents(user_id, upload_date DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.expense_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for expense_documents
CREATE POLICY "Users can view own expense documents"
  ON public.expense_documents
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create expense documents"
  ON public.expense_documents
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own expense documents"
  ON public.expense_documents
  FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own expense documents"
  ON public.expense_documents
  FOR DELETE
  USING ((SELECT auth.uid()) = user_id);
