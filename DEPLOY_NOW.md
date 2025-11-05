# 🚀 Deploy to Production NOW - 3 Step Guide

Your application is **production-ready**. Follow these 3 steps to deploy to the internet in **15 minutes**.

---

## Step 1: Create GitHub Repository (5 minutes)

### Option A: Using GitHub Web (Easiest)

1. Go to https://github.com/new
2. Fill in:
   - **Repository name**: `wirtschaftlichkeitsplan`
   - **Description**: "Financial planning dashboard for Austrian medical practices"
   - **Visibility**: Choose `Private` (recommended for medical data)
3. Click **Create repository**
4. Copy the HTTPS URL (e.g., `https://github.com/YOUR_USERNAME/wirtschaftlichkeitsplan.git`)

### Option B: Using GitHub CLI

```bash
gh repo create wirtschaftlichkeitsplan --private --source=. --remote=origin --push
```

---

## Step 2: Push Code to GitHub (5 minutes)

From your project directory:

```bash
git remote add origin https://github.com/YOUR_USERNAME/wirtschaftlichkeitsplan.git
git branch -M main
git push -u origin main
```

Wait for push to complete... ✓

---

## Step 3: Deploy to Vercel (5 minutes)

### Deploy Using Vercel Dashboard (Recommended)

1. Go to https://vercel.com/new
2. Click **Import Git Repository**
3. Select your GitHub repository (`wirtschaftlichkeitsplan`)
4. Configure:
   - **Framework**: Next.js (auto-detected)
   - **Root Directory**: ./
5. Under **Environment Variables**, add:
   ```
   NEXT_PUBLIC_SUPABASE_URL = your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY = your_anon_key
   ```
   (Copy these from Supabase → Settings → API)
6. Click **Deploy**

**Done!** Your app is now live. Vercel will give you a URL like `https://wirtschaftlichkeitsplan.vercel.app`

---

## Step 4: Final Configuration (2 minutes)

### Update Supabase Authentication URLs

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Under **Redirect URLs**, add:
   ```
   https://your-vercel-url.vercel.app/auth/callback
   https://your-vercel-url.vercel.app
   ```
   Replace `your-vercel-url` with your actual Vercel URL
3. Click **Save**

### Test Your Deployment

1. Visit your Vercel URL in browser
2. You should see the login page ✓
3. Create a test account with email/password ✓
4. Navigate through dashboard to verify everything works ✓

---

## ✅ Success Checklist

- [ ] GitHub repository created and code pushed
- [ ] Vercel deployment complete with URL
- [ ] Environment variables set in Vercel
- [ ] Supabase redirect URLs configured
- [ ] Can access your Vercel URL in browser
- [ ] Can sign up/login successfully
- [ ] Can see empty dashboard (ready for data)

---

## 🆘 Troubleshooting

### "Supabase URL is required"
- Check `NEXT_PUBLIC_SUPABASE_URL` is set in Vercel (Settings → Environment Variables)
- Verify URL has NO trailing slash

### "Authentication failed"
- Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct in Vercel
- Verify Supabase redirect URLs include your Vercel domain

### "Build failed on Vercel"
- Check Vercel build logs for specific error
- Common: missing environment variables
- Solution: Add missing variables in Vercel Settings

### "Database table not found"
- You haven't run migrations yet!
- Go to Supabase → SQL Editor
- Copy content from `supabase/migrations/001_create_tables.sql`
- Paste and run in SQL Editor
- Then test again

---

## 🎉 What's Next?

After deployment is working:

1. **Set up monitoring** (optional but recommended):
   - Vercel Analytics (automatic)
   - Supabase monitoring (automatic)

2. **Configure custom domain** (optional):
   - In Vercel → Settings → Domains
   - Follow DNS instructions from your domain provider
   - Update Supabase redirect URLs

3. **Start using the app**:
   - Create therapy types
   - Plan monthly sessions
   - View break-even analysis
   - Monitor business dashboard

4. **Customize** (optional):
   - Change colors in `tailwind.config.ts`
   - Update company name in `app/layout.tsx`
   - Add your logo and branding

---

## 📊 Deployment Complete!

Your Financial Planning Dashboard is now **live on the internet**.

- ✅ Secure (HTTPS by default on Vercel)
- ✅ DSGVO-compliant (EU data, RLS policies)
- ✅ Scalable (Vercel + Supabase handle growth)
- ✅ Professional (Custom domain ready)

---

## 📞 Support

- **Vercel Issues**: https://vercel.com/help
- **Supabase Issues**: https://supabase.com/docs
- **Next.js Issues**: https://nextjs.org/docs

---

**Your app is production-ready. Deploy it now!** 🚀

For detailed instructions, see:
- `DEPLOYMENT_GUIDE.md` - Complete step-by-step guide
- `PRODUCTION_CHECKLIST.md` - Pre-deployment verification
- `DEPLOYMENT_SUMMARY.md` - Project overview
