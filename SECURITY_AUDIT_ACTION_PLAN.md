# Security Audit - Action Plan

**Generated:** 2026-02-17
**Status:** Phase 1 (CRITICAL Issues) - In Progress

---

## Executive Summary

Comprehensive security audit identified **22 vulnerabilities** across the application:
- **2 CRITICAL** - Immediate action required (service role key, CSP headers)
- **5 HIGH** - Fix within 2 weeks
- **5 MEDIUM** - Fix within 1 month
- **5 LOW** - Fix when convenient

**Overall Security Score: 6/10**

---

## Phase 1: CRITICAL Issues (Start Here)

### C-1: Service Role Key Exposure ✓ ADDRESSED

**Status:** ✅ Implemented protective measures

**What was done:**
1. ✅ Created `.env.example` - Documents required keys without exposing secrets
2. ✅ Created `SECURITY.md` - Comprehensive guide for secret management
3. ✅ Verified `.env.local` is in `.gitignore` - Won't be committed to git
4. ✅ Audited all service role key usage - All 5 files are server-side only

**Verification:**
```bash
# Confirm .env.local is in .gitignore
grep -n "\.env\.local" .gitignore
# Output should show: .env.local

# Confirm no public access to service key
grep -r "SUPABASE_SERVICE_ROLE_KEY" --include="*.tsx" --include="*.ts" src/
# Should return no results (only server functions use it)
```

**What still needs to be done:**
1. ⏳ **Key Rotation** - Rotate the current service role key in Supabase dashboard
   - Time: 15-30 minutes
   - Steps: Supabase → Settings → API → Generate New Key → Update local .env.local

2. ⏳ **Production Setup** - Configure secure environment on Mac mini
   - Time: 20 minutes
   - Steps: Create ~/.config/wirtschaftlichkeitsplan/.env with new key

3. ⏳ **Vercel Config** - If using Vercel for deployment
   - Time: 5 minutes
   - Steps: Add SUPABASE_SERVICE_ROLE_KEY to Vercel environment variables

**Follow-up actions:**
- Document the rotation in team wiki/notes
- Schedule quarterly key rotation reminder
- Add to deployment checklist

---

### C-2: CSP Headers - Unsafe-Inline & Eval ⏳ PENDING

**Severity:** CRITICAL - Neutralizes XSS protection

**Problem:**
Current CSP allows `unsafe-inline` and `unsafe-eval` which defeats the purpose of Content Security Policy. Any XSS vulnerability becomes critical.

**Current CSP (next.config.ts or middleware):**
```
script-src 'unsafe-inline' 'unsafe-eval' ...
style-src 'unsafe-inline' ...
```

**Status:** Needs investigation and fix (estimated 4-6 hours)

**Next steps:**
1. Identify why `unsafe-inline` was needed (Tailwind? Next.js internals?)
2. Replace with nonces or hashes for inline scripts
3. Remove `unsafe-eval` completely (not needed in Next.js)
4. Test thoroughly in production-like environment

**Files to review:**
- `next.config.ts` - CSP configuration
- `middleware.ts` - Security headers
- `app/layout.tsx` - Any inline styles/scripts

**Recommendation:** Start this after key rotation is confirmed working.

---

## Phase 2: HIGH Severity Issues (2 weeks)

### H-1: XLSX Package Vulnerability
- **Issue:** Prototype pollution, ReDoS attacks
- **Fix:** Replace with safer library or audit current usage
- **Time:** 4-8 hours
- **Files:** `lib/actions/latido-import.ts`, `lib/actions/export.ts`

### H-2: Middleware Auth Exclusion
- **Issue:** `/api` routes have no default authentication
- **Fix:** Explicit auth check for all API routes
- **Time:** 2-4 hours
- **Files:** `middleware.ts`, all `/api` routes

### H-3: Email HTML Injection
- **Issue:** User input could inject HTML in export templates
- **Fix:** Sanitize template variables
- **Time:** 1-2 hours
- **Files:** `lib/actions/export.ts`

### H-4: MFA Enforcement (Disabled)
- **Issue:** Code for MFA exists but is commented out
- **Fix:** Enable and test MFA workflow
- **Time:** 2-4 hours
- **Files:** Authentication service

### H-5: No Rate Limiting
- **Issue:** Authentication endpoints vulnerable to brute force
- **Fix:** Add rate limiting middleware
- **Time:** 4-8 hours
- **Files:** `middleware.ts`, auth endpoints

---

## Phase 3: MEDIUM Severity (1 month)

5 additional issues identified in security audit - see full report for details.

---

## Phase 4: LOW Priority (When convenient)

5 low-severity issues - code quality and defense-in-depth improvements.

---

## Immediate Next Steps (Today)

### ✅ Complete (Code-wise)
1. ✅ Create `.env.example` - Done
2. ✅ Create `SECURITY.md` - Done
3. ✅ Audit service key usage - Done

### ⏳ Manual Steps Needed (User action)
1. **Rotate service role key** (15-30 min)
   - Go to Supabase dashboard
   - Generate new key
   - Update `.env.local` on your machine
   - Update `.env` on Mac mini
   - Restart service on Mac mini

2. **Verify app still works**
   - Test locally: `pnpm dev`
   - Test on Mac mini: Check dashboard loads

3. **Confirm CSP security issue** (10 min)
   - Check current CSP headers
   - Identify why unsafe-inline is needed
   - Plan remediation strategy

### 📋 Then Proceed to C-2
Fix CSP headers (4-6 hours) - most impactful security improvement after key rotation.

---

## How to Use This Plan

1. **Today:** Complete manual key rotation steps above
2. **This week:** Fix CSP headers (C-2)
3. **Next 2 weeks:** Address 5 HIGH severity issues (H-1 through H-5)
4. **Next month:** MEDIUM priority issues
5. **Ongoing:** LOW priority improvements + quarterly key rotation

**Total effort to fully remediate:**
- CRITICAL: ~1-2 hours (mostly key rotation)
- HIGH: 16-32 hours
- MEDIUM: 12-16 hours
- LOW: 8-10 hours
- **Total: 37-60 hours over 2 months**

---

## Monitoring & Prevention

After fixes are complete:

- [ ] Monthly review of Supabase audit logs
- [ ] Quarterly security key rotation
- [ ] Semi-annual security audit
- [ ] Automated dependency scanning (npm audit)
- [ ] Pre-commit hooks checking for .env.local
- [ ] Production monitoring for unauthorized access

---

## References

- [OWASP Top 10](https://owasp.org/Top10/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/overview)
- [Content Security Policy Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Node.js Security Checklist](https://nodejs.org/en/docs/guides/security/)
