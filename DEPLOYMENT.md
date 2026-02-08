# Deployment Guide - Wirtschaftlichkeitsplan (Finance App)

## 📋 Pre-Deployment Checklist

### ✅ Build Status
- ✓ Next.js 16.0.10 compiled successfully
- ✓ All 17 pages compiled
- ✓ Production build: 28MB
- ✓ No TypeScript errors
- ✓ Security headers configured

### ✅ Security Verification
- ✓ OCR endpoint authenticated
- ✓ Image upload validation (10MB max)
- ✓ Password policy: minimum 8 characters
- ✓ Security headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- ✓ Next.js RCE vulnerability patched (16.0.10)

### ✅ Environment
- ✓ .env.local is gitignored
- ✓ No secrets in build output
- ✓ Dynamic routes properly configured
- ✓ Static pages prerendered

## 🚀 Deployment to All-Inkl (finance.hinterbuchinger.com)

### Requirements
- FTP access to w020cf7c.kasserver.com
- All-Inkl control panel access
- Node.js runtime support (for server-side rendering)

### Deployment Steps

#### Option 1: Using Deployment Script
```bash
cd /Users/Missbach/deployment
./deploy-finance.sh
```

#### Option 2: Manual FTP Upload
```bash
lftp -e "
open w020cf7c.kasserver.com
user w020cf7c [PASSWORD]
cd /www/htdocs/w020cf7c/finance.hinterbuchinger.com/
mput -i /Users/Missbach/Desktop/claude/wirtschaftlichkeitsplan/.next/static/**/*
mput -i /Users/Missbach/Desktop/claude/wirtschaftlichkeitsplan/.next/server/**/*
mput -i /Users/Missbach/Desktop/claude/wirtschaftlichkeitsplan/public/**/*
bye
" -u w020cf7c sftp://w020cf7c.kasserver.com

# Copy node_modules and package files
scp -r /Users/Missbach/Desktop/claude/wirtschaftlichkeitsplan/node_modules \
  w020cf7c@w020cf7c.kasserver.com:/www/htdocs/w020cf7c/finance.hinterbuchinger.com/

scp /Users/Missbach/Desktop/claude/wirtschaftlichkeitsplan/package.json \
  w020cf7c@w020cf7c.kasserver.com:/www/htdocs/w020cf7c/finance.hinterbuchinger.com/

scp /Users/Missbach/Desktop/claude/wirtschaftlichkeitsplan/pnpm-lock.yaml \
  w020cf7c@w020cf7c.kasserver.com:/www/htdocs/w020cf7c/finance.hinterbuchinger.com/
```

### Server Configuration

#### Node.js Setup on All-Inkl
1. Access All-Inkl Control Panel
2. Navigate to Node.js Settings
3. Create new Node.js application
4. Set application root to: `/www/htdocs/w020cf7c/finance.hinterbuchinger.com/`
5. Set start script to: `npm start` (or `node .next/standalone/server.js`)
6. Configure port (typically 3000, mapped to web server)

#### Environment Variables on Server
Create `.env.production` on the server with:
```
NEXT_PUBLIC_APP_URL=https://finance.hinterbuchinger.com
NEXT_PUBLIC_SUPABASE_URL=https://[your-supabase-url].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
```

#### Database Configuration
1. Verify Supabase project is accessible
2. Confirm RLS policies are enabled on all tables
3. Test authentication flow with production credentials
4. Verify backup strategy is in place

### Post-Deployment Verification

```bash
# Test the application
curl -I https://finance.hinterbuchinger.com

# Check security headers
curl -I https://finance.hinterbuchinger.com | grep -i "X-Frame-Options\|X-Content-Type-Options"

# Verify login page loads
curl https://finance.hinterbuchinger.com/login

# Test API endpoint
curl -X POST https://finance.hinterbuchinger.com/api/ocr/parse-bill \
  -H "Content-Type: application/json" \
  -d '{"imageBase64": "test", "extractedText": "test"}'
# Should return 401 (unauthorized) - this is correct behavior
```

### Monitoring & Logging

- Enable application logging in All-Inkl control panel
- Configure error tracking (Sentry recommended)
- Monitor performance metrics
- Set up automated backups for Supabase database

### Rollback Procedure

If deployment has issues:
1. SSH into server
2. Checkout previous version: `git checkout [previous-commit]`
3. Rebuild: `npm run build`
4. Restart Node.js application
5. Verify: `curl https://finance.hinterbuchinger.com`

### Common Issues & Solutions

**Issue: Node.js application won't start**
- Solution: Check logs for missing dependencies, verify `npm install` completed

**Issue: Database connection fails**
- Solution: Verify Supabase credentials in `.env.production`, test with `NEXT_PUBLIC_SUPABASE_URL`

**Issue: Static assets return 404**
- Solution: Ensure `.next/static` is properly uploaded, check file permissions

**Issue: API routes timeout**
- Solution: Check All-Inkl timeout limits, increase if necessary

## 📊 Deployment Metrics

| Metric | Value |
|--------|-------|
| Build Size | 28MB |
| Pages | 17 (16 static + 1 dynamic) |
| Dependencies | 117 packages |
| Node Version | 20.x+ |
| Next.js | 16.0.10 |
| React | 19.2.0 |

## 🔒 Security Notes

- All environment secrets stored in server `.env.production`
- No credentials in version control
- OCR endpoint requires authentication
- HTTPS enforced (via All-Inkl)
- Security headers configured
- RLS policies enabled on database
- Password minimum 8 characters

## 📝 Post-Deployment Checklist

- [ ] Application loads at https://finance.hinterbuchinger.com
- [ ] Login page displays correctly
- [ ] User registration works
- [ ] Dashboard loads with authenticated user
- [ ] All navigation links work
- [ ] Database queries function correctly
- [ ] Error pages display properly
- [ ] Mobile responsiveness verified
- [ ] Security headers present
- [ ] Performance acceptable
- [ ] Backup system operational
- [ ] Monitoring configured

## 🆘 Support

For issues or questions:
1. Check logs in All-Inkl control panel
2. Verify environment variables
3. Test Supabase connectivity
4. Review security headers
5. Check Node.js process status

---

**Deployment Date**: [To be filled]  
**Deployed By**: [To be filled]  
**Production URL**: https://finance.hinterbuchinger.com
