-- Table: latido_invoices
-- Stores invoices imported from Latido platform
CREATE TABLE IF NOT EXISTS public.latido_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  payment_method TEXT NOT NULL, -- Bankomat, Kreditkarte, etc.
  net_amount DECIMAL(10, 2) NOT NULL CHECK (net_amount >= 0),
  vat_10_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (vat_10_amount >= 0),
  vat_13_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (vat_13_amount >= 0),
  vat_20_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (vat_20_amount >= 0),
  gross_amount DECIMAL(10, 2) NOT NULL CHECK (gross_amount >= 0),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'pending')),
  payment_date DATE,
  practice_name TEXT,
  practice_address TEXT,
  external_transaction_id TEXT,
  import_id UUID REFERENCES public.latido_import_sessions(id) ON DELETE SET NULL,
  reconciled BOOLEAN NOT NULL DEFAULT FALSE,
  matched_monthly_plan_id UUID REFERENCES public.monthly_plans(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, invoice_number)
);

-- Table: latido_import_sessions
-- Tracks import history for audit and reconciliation
CREATE TABLE IF NOT EXISTS public.latido_import_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  import_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_invoices INTEGER NOT NULL DEFAULT 0,
  successfully_imported INTEGER NOT NULL DEFAULT 0,
  failed_imports INTEGER NOT NULL DEFAULT 0,
  import_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: latido_reconciliation
-- Tracks matching between Latido invoices and internal therapy sessions
CREATE TABLE IF NOT EXISTS public.latido_reconciliation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latido_invoice_id UUID NOT NULL REFERENCES public.latido_invoices(id) ON DELETE CASCADE,
  monthly_plan_id UUID NOT NULL REFERENCES public.monthly_plans(id) ON DELETE CASCADE,
  latido_amount DECIMAL(10, 2) NOT NULL,
  calculated_amount DECIMAL(10, 2) NOT NULL,
  discrepancy_amount DECIMAL(10, 2) NOT NULL,
  discrepancy_percent DECIMAL(5, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'unmatched', 'partial')),
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, latido_invoice_id, monthly_plan_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_latido_invoices_user_id ON public.latido_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_latido_invoices_date ON public.latido_invoices(user_id, invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_latido_invoices_payment_status ON public.latido_invoices(user_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_latido_invoices_reconciled ON public.latido_invoices(user_id, reconciled);
CREATE INDEX IF NOT EXISTS idx_latido_import_sessions_user_id ON public.latido_import_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_latido_reconciliation_user_id ON public.latido_reconciliation(user_id);
CREATE INDEX IF NOT EXISTS idx_latido_reconciliation_status ON public.latido_reconciliation(user_id, status);

-- Enable Row Level Security
ALTER TABLE public.latido_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.latido_import_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.latido_reconciliation ENABLE ROW LEVEL SECURITY;

-- RLS Policies for latido_invoices
CREATE POLICY "Users can view own latido invoices"
  ON public.latido_invoices
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create latido invoices"
  ON public.latido_invoices
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own latido invoices"
  ON public.latido_invoices
  FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own latido invoices"
  ON public.latido_invoices
  FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- RLS Policies for latido_import_sessions
CREATE POLICY "Users can view own import sessions"
  ON public.latido_import_sessions
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create import sessions"
  ON public.latido_import_sessions
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own import sessions"
  ON public.latido_import_sessions
  FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- RLS Policies for latido_reconciliation
CREATE POLICY "Users can view own reconciliation records"
  ON public.latido_reconciliation
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create reconciliation records"
  ON public.latido_reconciliation
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own reconciliation records"
  ON public.latido_reconciliation
  FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- PostgreSQL Function to reconcile Latido invoices with monthly plans
CREATE OR REPLACE FUNCTION reconcile_latido_invoice(
  p_user_id UUID,
  p_invoice_id UUID
)
RETURNS TABLE(
  invoice_number TEXT,
  invoice_amount DECIMAL,
  expected_amount DECIMAL,
  discrepancy DECIMAL,
  discrepancy_percent DECIMAL,
  matched_month TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH invoice_data AS (
    SELECT li.id, li.invoice_number, li.invoice_date, li.gross_amount
    FROM public.latido_invoices li
    WHERE li.id = p_invoice_id AND li.user_id = p_user_id
  ),
  monthly_totals AS (
    SELECT
      id.invoice_number,
      id.invoice_date,
      id.gross_amount,
      DATE_TRUNC('month', id.invoice_date)::DATE as month,
      COALESCE(SUM(mp.actual_sessions * tt.price_per_session), 0) as expected_revenue
    FROM invoice_data id
    LEFT JOIN public.monthly_plans mp ON mp.user_id = p_user_id
      AND DATE_TRUNC('month', mp.month)::DATE = DATE_TRUNC('month', id.invoice_date)::DATE
    LEFT JOIN public.therapy_types tt ON tt.id = mp.therapy_type_id
    GROUP BY id.invoice_number, id.invoice_date, id.gross_amount
  )
  SELECT
    mt.invoice_number,
    mt.gross_amount,
    mt.expected_revenue,
    (mt.gross_amount - mt.expected_revenue) as discrepancy,
    CASE
      WHEN mt.expected_revenue = 0 THEN 0
      ELSE ROUND(((mt.gross_amount - mt.expected_revenue) / mt.expected_revenue * 100)::numeric, 2)
    END as discrepancy_percent,
    TO_CHAR(mt.month, 'YYYY-MM')::TEXT
  FROM monthly_totals mt;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PostgreSQL Function to get reconciliation summary
CREATE OR REPLACE FUNCTION get_latido_reconciliation_summary(
  p_user_id UUID,
  p_month DATE DEFAULT NULL
)
RETURNS TABLE(
  total_invoices INTEGER,
  total_amount DECIMAL,
  reconciled_count INTEGER,
  unreconciled_count INTEGER,
  discrepancy_total DECIMAL,
  payment_status_summary TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH invoice_summary AS (
    SELECT
      COUNT(*) as total_count,
      SUM(gross_amount) as total_amount,
      SUM(CASE WHEN reconciled THEN 1 ELSE 0 END) as reconciled,
      SUM(CASE WHEN NOT reconciled THEN 1 ELSE 0 END) as unreconciled,
      COALESCE(SUM(gross_amount) - SUM(
        CASE WHEN matched_monthly_plan_id IS NOT NULL
        THEN (SELECT SUM(mp.actual_sessions * tt.price_per_session)
              FROM public.monthly_plans mp
              JOIN public.therapy_types tt ON tt.id = mp.therapy_type_id
              WHERE mp.id = matched_monthly_plan_id)
        ELSE 0
        END
      ), 0) as discrepancy
    FROM public.latido_invoices
    WHERE user_id = p_user_id
      AND (p_month IS NULL OR DATE_TRUNC('month', invoice_date)::DATE = DATE_TRUNC('month', p_month)::DATE)
  ),
  payment_summary AS (
    SELECT
      STRING_AGG(payment_status || ':' || COUNT(*)::text, ', ' ORDER BY payment_status) as status_text
    FROM public.latido_invoices
    WHERE user_id = p_user_id
      AND (p_month IS NULL OR DATE_TRUNC('month', invoice_date)::DATE = DATE_TRUNC('month', p_month)::DATE)
    GROUP BY user_id
  )
  SELECT
    inv.total_count::INTEGER,
    inv.total_amount,
    inv.reconciled::INTEGER,
    inv.unreconciled::INTEGER,
    inv.discrepancy,
    COALESCE(ps.status_text, 'No invoices')
  FROM invoice_summary inv
  CROSS JOIN payment_summary ps;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
