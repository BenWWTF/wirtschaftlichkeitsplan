# Transitioning to Real Data - Setup Guide

This guide will help you transition your app from mock data to real data. Follow these steps in order.

## Step 1: Verify Supabase Connection

Your app uses the following environment variables for Supabase:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Check your `.env.local` file:

```bash
cat .env.local | grep SUPABASE
```

You should see output like:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

If these are missing or empty, you need to:
1. Go to https://supabase.com/dashboard
2. Create or access your project
3. Find Settings → API → Project URL and anon key
4. Add them to `.env.local`

## Step 2: Apply Database Migrations

The new Latido invoicing tables need to be created in your Supabase database.

### Option A: Using Supabase Dashboard (Easiest)

1. Go to your Supabase project → SQL Editor
2. Create a new query and paste the contents of:
   ```
   supabase/migrations/003_create_latido_invoices_tables.sql
   ```
3. Click "Run"

The migration creates:
- `latido_invoices` table for imported invoices
- `latido_import_sessions` table for import history
- `latido_reconciliation` table for matching invoices
- Row Level Security (RLS) policies
- PostgreSQL functions for reconciliation

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-id

# Apply migrations
supabase db push
```

## Step 3: Understand Current Architecture

The app currently uses a **demo user mode** for testing without authentication:

```
DEMO_USER_ID = '00000000-0000-0000-0000-000000000000'
```

All data is currently stored under this ID. You have two options:

### Option A: Keep Demo User Mode (Easier for testing)
- Continue using the hardcoded demo user ID
- All your test data will be stored together
- No authentication setup needed
- Good for testing all features before adding auth

### Option B: Set Up Authentication (Better for real use)
- Users log in with email/password or OAuth
- Each user has isolated data
- More secure and production-ready
- Requires setting up Supabase Auth

**Recommendation**: Start with Option A to test everything, then implement Option B for production use.

## Step 4: Verify Database Connection

The app checks the database when you access any dashboard page. You should see real data instead of mock data.

### If you see mock data instead of real data:

1. Check browser console (F12 → Console tab)
2. Look for error messages about Supabase connection
3. Verify your environment variables in `.env.local`
4. Restart the dev server: `pnpm dev`

## Step 5: Create Your First Therapy Type

1. Go to **Einstellungen (Settings)** in the dashboard
2. Click "Neue Therapieart hinzufügen" (Add new therapy type)
3. Enter:
   - **Name**: e.g., "Psychotherapie"
   - **Price per session**: e.g., 100
   - **Variable cost**: e.g., 15

This will be stored in your real Supabase database.

## Step 6: Create Monthly Plans

1. Go to **Planung (Planning)**
2. Add monthly plans with:
   - Therapy type
   - Planned sessions
   - Month

## Step 7: Log Therapy Sessions

1. Go to **Dashboard**
2. You should be able to log actual sessions completed
3. This updates your profitability metrics

## Step 8: Test the Latido Import

1. Go to **Dashboard → Import (Latido)**
2. Upload your Latido Excel export file
3. Review the imported invoices in **Reconciliation Dashboard**

## Monitoring

### Check if real data is being used:

1. **Go to Dashboard** - You should see your real therapy types (or empty if not created yet)
2. **Check browser console** - No "Using mock data" messages
3. **Check Supabase** - Data should appear in your database tables

### Common Issues

**Problem**: Still seeing mock data
- **Solution**: Check Supabase connection, verify environment variables

**Problem**: "Unauthorized" errors when uploading files
- **Solution**: User ID might not match, ensure you're using the demo user ID correctly

**Problem**: Latido import fails
- **Solution**: Check Excel file format matches expected columns (see import page for format info)

## Next Steps

Once you've verified everything works with real data:

1. **Optional: Enable Authentication**
   - Set up Supabase Auth (Email, Google OAuth, etc.)
   - Update actions to use authenticated user IDs instead of demo ID

2. **Optional: Add More Data Entry**
   - Create UI for bulk data import
   - Add expense tracking
   - Set up recurring sessions

3. **Optional: Customize Validation**
   - Add business rules to VAT calculations
   - Set minimum/maximum values for therapies

## Database Tables Created

Your Supabase now has these new tables:

```
latido_invoices
├── id (UUID)
├── user_id (UUID) → references auth.users
├── invoice_number (TEXT)
├── invoice_date (DATE)
├── gross_amount (DECIMAL)
├── vat_10_amount, vat_13_amount, vat_20_amount (DECIMAL)
├── payment_status (paid/unpaid/pending)
└── ... (see migration file for full schema)

latido_import_sessions
├── id (UUID)
├── user_id (UUID)
├── file_name (TEXT)
├── total_invoices (INTEGER)
├── successfully_imported (INTEGER)
└── import_date (TIMESTAMPTZ)

latido_reconciliation
├── id (UUID)
├── latido_invoice_id (UUID) → references latido_invoices
├── monthly_plan_id (UUID) → references monthly_plans
├── discrepancy_amount (DECIMAL)
└── ... (see migration file for full schema)
```

## Questions or Issues?

If you encounter problems:
1. Check the browser console for error messages
2. Check your Supabase dashboard for connection/RLS policy errors
3. Verify the migration was applied successfully
4. Ensure environment variables are correct

Good luck with your real data testing!
