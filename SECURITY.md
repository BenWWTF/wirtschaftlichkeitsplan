# Security Guide - Wirtschaftlichkeitsplan

## Secret Management

This document outlines how to securely manage sensitive credentials for this application.

### 1. Environment Variables Classification

#### 🟢 PUBLIC (Safe to commit)
These can be stored in `.env.local` and `.env.example`:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anonymous (limited) API key for client-side auth
- `NEXT_PUBLIC_APP_NAME` - Application name
- `NEXT_PUBLIC_APP_URL` - Application URL

#### 🔴 SECRET (Never commit)
These must NEVER be committed to git. Only store in:
- `.env.local` (local development only - already in `.gitignore`)
- Vercel Environment Variables dashboard (production)
- Mac Mini: Environment file in `~/.config/wirtschaftlichkeitsplan/.env` (not included in git)

**Secret keys:**
- `SUPABASE_SERVICE_ROLE_KEY` - **MASTER KEY** - bypasses all Row-Level Security (RLS)

### 2. Service Role Key - Why It's Critical

The `SUPABASE_SERVICE_ROLE_KEY` is your application's **master key**. It:

- ✓ Bypasses all Row-Level Security (RLS) policies
- ✓ Can access or modify ANY data in the database
- ✓ Can manage users, roles, and permissions
- ✓ Is used legitimately for server-side operations only

**If compromised, an attacker can:**
- ✗ Read/modify all user data
- ✗ Modify safety-critical settings
- ✗ Upload/delete files
- ✗ Create/delete database records

### 3. Proper Usage - Current Implementation

**✓ Correct usage in your codebase:**

All service role key usage is in server-side actions (marked with `'use server'`):
- `lib/actions/latido-import.ts` - Import invoice data
- `lib/actions/monthly-results.ts` - Calculate results
- `lib/actions/export.ts` - Export data
- `lib/actions/documents.ts` - Upload/manage documents
- `utils/supabase/service-client.ts` - Service client factory

**Why this is safe:**
- Never accessible to client JavaScript
- Never sent to browser
- Only available in server functions
- Not exposed in build artifacts

### 4. Local Development Setup

**First time setup:**

```bash
# 1. Copy the template
cp .env.example .env.local

# 2. Get your keys from Supabase dashboard:
#    - Go to: https://app.supabase.com/project/YOUR_PROJECT/settings/api
#    - Copy the Anon Key and Service Role Key

# 3. Edit .env.local and paste your actual keys
# 4. DO NOT commit .env.local (already in .gitignore)

# 5. Verify it works
pnpm dev
```

**Important:** `.env.local` is already in `.gitignore` - it will never be committed to git.

### 5. Production Deployment on Mac Mini

For 24/7 production on the Mac Mini:

**Option A: Vercel Environment Variables (Recommended if using Vercel)**
```bash
# 1. Go to Vercel dashboard → Your Project → Settings → Environment Variables
# 2. Add SUPABASE_SERVICE_ROLE_KEY with the production value
# 3. No .env file needed in production
```

**Option B: Local Environment File (For Mac Mini/Self-hosted)**
```bash
# 1. SSH into Mac mini
ssh user@mac-mini

# 2. Create secure config directory (not in git)
mkdir -p ~/.config/wirtschaftlichkeitsplan
chmod 700 ~/.config/wirtschaftlichkeitsplan

# 3. Create .env file there (never sync this with git)
cat > ~/.config/wirtschaftlichkeitsplan/.env << 'EOF'
SUPABASE_SERVICE_ROLE_KEY=your_actual_key_here
EOF

# 4. Set restrictive permissions
chmod 600 ~/.config/wirtschaftlichkeitsplan/.env

# 5. Update launchd service to source this file before starting
# Edit: ~/Library/LaunchAgents/com.wirtschaftlichkeitsplan.plist
# Add: <key>EnvironmentVariables</key> with path reference
```

### 6. Key Rotation Procedure

**When to rotate:**
- Quarterly security review
- If someone else had access to the key
- If .env.local was accidentally committed
- After any suspected compromise

**Steps:**

1. **Generate new key in Supabase:**
   - Go to: https://app.supabase.com/project/YOUR_PROJECT/settings/api
   - Click "Generate new key" under Service Role Key
   - Save the new key

2. **Update local development:**
   ```bash
   # Update .env.local with new key
   echo "SUPABASE_SERVICE_ROLE_KEY=new_key_here" >> .env.local
   ```

3. **Update production (Vercel):**
   ```bash
   # Update environment variable in Vercel dashboard
   # Then redeploy or restart service
   ```

4. **Update Mac Mini:**
   ```bash
   # SSH and update the config file
   nano ~/.config/wirtschaftlichkeitsplan/.env
   # Paste new key, save, restart service
   ```

5. **Verify:**
   ```bash
   # Test that app still works
   # Check logs for any auth errors
   ```

6. **Audit log:**
   ```bash
   # In Supabase dashboard, check the API audit log
   # Verify the old key is no longer in use
   ```

### 7. Security Best Practices Checklist

- [ ] `.env.local` is in `.gitignore` (prevents accidental commits)
- [ ] `.env.example` is committed (shows required structure)
- [ ] Service role key only used in `'use server'` functions
- [ ] No `SUPABASE_SERVICE_ROLE_KEY` logged in output
- [ ] Vercel environment variables configured (if using Vercel)
- [ ] Mac Mini uses secure config directory outside git
- [ ] Quarterly key rotation scheduled
- [ ] Team members understand key security level
- [ ] API audit logs reviewed monthly
- [ ] Build logs don't expose environment variables

### 8. Monitoring & Auditing

**Check if key has been exposed:**

```bash
# Search GitHub for your project (detects accidental commits)
site:github.com "SUPABASE_SERVICE_ROLE_KEY" "your_key_start"

# Check Supabase audit log
# Go to: https://app.supabase.com/project/YOUR_PROJECT/reports/auth
```

**Watch for suspicious activity:**
- Unexpected database queries
- Unauthorized file uploads
- Permission changes
- Policy modifications

### 9. Incident Response

**If you suspect key compromise:**

1. **Immediately rotate the key:**
   - Generate new Service Role Key in Supabase
   - Update all deployments within 30 minutes

2. **Review activity:**
   - Check Supabase audit log for suspicious queries
   - Check storage audit for unauthorized uploads
   - Check database backups for unauthorized changes

3. **Verify integrity:**
   - Scan database for injected data
   - Review all file uploads
   - Audit user permissions

4. **Document incident:**
   - Record when it happened
   - What was potentially accessed
   - Corrective actions taken

---

## Additional Security Measures

### Code Security
- ✓ All server actions validate input with Zod
- ✓ Row-level security (RLS) enforced on all tables
- ✓ Service role key only used when necessary
- ✓ No secrets logged to stdout

### Database Security
- ✓ RLS policies protect user data
- ✓ Service role used for legitimate schema-cache bypasses
- ✓ Storage bucket policies enforce user isolation

### Deployment Security
- ✓ `.env.local` excluded from git
- ✓ `.env.example` serves as template
- ✓ Production uses secure environment variables
- ✓ No secrets in docker images or build artifacts

---

## Questions?

Refer to:
- [Supabase Security Guide](https://supabase.com/docs/guides/auth/overview)
- [Supabase API Keys Docs](https://supabase.com/docs/guides/api)
- [Environment Variables Best Practices](https://12factor.net/config)
