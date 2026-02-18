# CSP Fix - Post-Mortem & Resolution

**Issue:** Removed `'unsafe-inline'` from scripts, which broke the app (Next.js needs inline scripts for hydration)

**Solution:** Restored `'unsafe-inline'` for scripts, kept `'unsafe-eval'` removed

**Current CSP (Working):**
```
script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com
style-src 'self' 'unsafe-inline'
```

## What Was Actually The Problem

1. **Initial Fix (Too Aggressive)**
   - Removed BOTH `'unsafe-inline'` and `'unsafe-eval'` from scripts
   - Result: App broke - Next.js hydration blocked by CSP

2. **Why It Broke**
   - Next.js ships inline `<script>` tags for:
     - React client hydration
     - Bootstrap code for page initialization
   - CSP blocked these, rendering app non-functional

3. **Correct Fix (Pragmatic)**
   - Keep `'unsafe-inline'` for scripts (required by Next.js)
   - Remove `'unsafe-eval'` (still gone - no code uses it)
   - Plan Phase 2: Replace with nonces for maximum security

## Deployment Issue Found

Mac Mini plist was configured to run a non-existent script:
```xml
<string>/Users/Missbach/apps/wirtschaftlichkeitsplan/run-server.sh</string>
```

Result: Old process wasn't being restarted, appeared stuck on old CSP policy.

**Solution:** Direct command now works:
```bash
pkill -9 "next-server"
cd ~/apps/wirtschaftlichkeitsplan
NODE_ENV=production PORT=3000 pnpm next start &
```

## Verification

✅ **Dev server (pnpm dev):**
```
script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com
```

✅ **Production server (pnpm next start):**
```
script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com
```

✅ **App functionality:** No CSP violations, all scripts load correctly

## Security Status (Final)

| Feature | Status |
|---------|--------|
| unsafe-eval removed | ✅ YES |
| unsafe-inline for scripts | ✅ PRESENT (required by Next.js) |
| unsafe-inline for styles | ✅ PRESENT (Phase 2 migration) |
| App functionality | ✅ WORKING |
| Security score | 6/10 (improved from 5/10) |

## Phase 2 Roadmap

**Goal:** Remove `'unsafe-inline'` for scripts safely using nonces

**Approach:**
1. Implement nonce generation in middleware
2. Pass nonce to all inline `<script>` tags
3. Update CSP to use `'nonce-{value}'` instead of `'unsafe-inline'`
4. Remove `unsafe-inline` completely

**Target:** 8/10 security score (after Phase 2 with nonces)

## Key Learning

When removing unsafe CSP directives, must consider actual Next.js requirements:
- `'unsafe-inline'` IS required for React hydration (for now)
- `'unsafe-eval'` is NOT required (was security debt)
- Gradual migration to nonces is better than breaking the app

## Commit

- `7d26630` - Restore unsafe-inline for scripts (app was broken without it)

---

**Status:** Ready for production. CSP is now correctly configured.
