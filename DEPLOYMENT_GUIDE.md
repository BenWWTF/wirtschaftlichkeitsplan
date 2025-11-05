# Deployment Guide - Wirtschaftlichkeitsplan

This guide will help you deploy the Wirtschaftlichkeitsplan application to production using Vercel and Supabase.

## Prerequisites

- GitHub account
- Vercel account (free tier available)
- Supabase account (with a project already created for the application)
- Node.js 18+ and pnpm installed locally

## Step 1: Create GitHub Repository

### Option A: Using GitHub Web Interface

1. Go to https://github.com/new
2. Repository name: `wirtschaftlichkeitsplan`
3. Description: "Financial planning dashboard for Austrian medical practices"
4. Choose visibility: Public or Private (your choice)
5. Click "Create repository"

### Option B: Using GitHub CLI

```bash
gh repo create wirtschaftlichkeitsplan --public --source=. --remote=origin --push
```

## Step 2: Connect Your Local Repository to GitHub

After creating the repository, get the HTTPS or SSH URL and run:

```bash
cd /path/to/wirtschaftlichkeitsplan
git remote add origin https://github.com/YOUR_USERNAME/wirtschaftlichkeitsplan.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

## Step 3: Prepare Environment Variables

### Create `.env.production.local`

Copy the example file and fill in your Supabase credentials:

```bash
cp .env.local.example .env.production.local
```

Edit `.env.production.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
```

Get these values from:
1. Go to Supabase dashboard
2. Select your project
3. Settings → API
4. Copy the Project URL and anon/public key

**Important:** Do NOT commit `.env.production.local` - it contains secrets!

## Step 4: Deploy to Vercel

### Option A: Using Vercel Web Interface (Recommended)

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your GitHub repository
4. Configure:
   - **Framework**: Next.js
   - **Root Directory**: ./
5. Under "Environment Variables", add:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```
6. Click "Deploy"

Vercel will automatically:
- Build your Next.js application
- Run tests and linting
- Deploy to their CDN
- Provide you with a live URL

### Option B: Using Vercel CLI

```bash
npm i -g vercel
vercel login
vercel

# Follow the prompts to connect your GitHub repo
# Add environment variables when prompted
```

## Step 5: Configure Supabase Authentication Redirect URLs

After Vercel deployment, you need to allow your deployed URL for authentication:

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Under "Redirect URLs", add:
   ```
   https://your-vercel-url.vercel.app/auth/callback
   https://your-vercel-url.vercel.app
   ```
3. Save the changes

## Step 6: Create Supabase Database Tables

### Option A: Using Supabase Dashboard

1. Go to SQL Editor in Supabase
2. Copy the contents of `supabase/migrations/001_create_tables.sql`
3. Paste into the SQL editor
4. Click "Execute"

### Option B: Using Supabase CLI

```bash
npm install -g supabase
supabase init
supabase link
supabase db push
```

## Step 7: Verify Deployment

1. Visit your Vercel URL
2. You should see the login page
3. Create a test account using email/password
4. Navigate through:
   - Dashboard
   - Therapy Management
   - Monthly Planning
   - Break-Even Analysis
   - Reports

If you see all pages loading correctly, your deployment is successful!

## Environment Variables Reference

Here are all environment variables you might need:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Optional: For development
SUPABASE_SERVICE_KEY=your_service_key  # Only needed for server-side operations
```

## Troubleshooting

### 1. "Supabase URL is required"
- Check that `NEXT_PUBLIC_SUPABASE_URL` is set in Vercel
- Ensure the URL doesn't have trailing slashes

### 2. "Authentication failed"
- Verify the anon key is correct in Vercel
- Check Supabase URL Configuration includes your Vercel URL

### 3. "Database table not found"
- Run the SQL migration from `supabase/migrations/001_create_tables.sql`
- Verify RLS policies are enabled

### 4. "Build fails on Vercel"
- Check build logs in Vercel dashboard
- Common issues:
  - Missing environment variables
  - TypeScript errors (check local `pnpm build`)
  - Dependency conflicts (check `pnpm-lock.yaml`)

## Custom Domain Setup (Optional)

1. In Vercel dashboard, go to Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions from your domain provider
4. Update Supabase URL Configuration with your custom domain

## Continuous Deployment

Your application is now set up for continuous deployment:
1. Any push to `main` branch automatically triggers deployment
2. Pull requests show deployment previews
3. Failed builds prevent deployment

## Security Checklist

Before going live:

- [ ] Environment variables are set in Vercel (not in code)
- [ ] `.env.production.local` is in `.gitignore`
- [ ] Supabase RLS policies are enabled
- [ ] Only authorized URLs in Supabase authentication
- [ ] Database backups configured in Supabase
- [ ] HTTPS enabled (default with Vercel)
- [ ] Rate limiting considered for auth endpoints

## Monitoring

### Vercel Analytics
- View in Vercel dashboard
- Monitor Core Web Vitals
- Check deployment history

### Supabase Monitoring
- Database usage in Supabase dashboard
- Authentication logs
- API analytics

## Rollback

If something goes wrong:

1. **Vercel**: Click "Deployments" → Select previous version → Click "Redeploy"
2. **Database**: Supabase keeps backups; restore via Settings → Backups

## Support & Resources

- Next.js Docs: https://nextjs.org/docs
- Supabase Docs: https://supabase.com/docs
- Vercel Docs: https://vercel.com/docs
- GitHub: This repository

## Next Steps After Deployment

1. **Customize**: Modify branding, colors, and company name
2. **Add Users**: Invite team members to manage the application
3. **Configure Backup**: Set up automated backups in Supabase
4. **Monitor**: Set up uptime monitoring and alerts
5. **Scale**: Monitor usage and upgrade plans if needed

Good luck with your deployment! 🚀
