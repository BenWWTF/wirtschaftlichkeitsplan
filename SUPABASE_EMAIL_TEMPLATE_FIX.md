# Supabase Email Template Configuration

## Problem Fixed ✅

The application was missing the email confirmation route handler (`/auth/confirm`). This has been **fixed and deployed**.

Now you need to update the Supabase email template so confirmation links point to the correct URL in your production app.

---

## How to Configure the Email Template

### Step 1: Login to Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project: **wirtschaftlichkeitsplan**

### Step 2: Navigate to Email Templates
1. In the left sidebar, click **Authentication**
2. Click **Email Templates**
3. Look for the template list on the right

### Step 3: Edit "Confirm signup" Template

1. Find and click on the **"Confirm signup"** email template
2. In the template editor, find this line:
   ```
   {{ .ConfirmationURL }}
   ```

3. Replace the entire line with:
   ```
   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
   ```

4. Click **Save** button

### Step 4: Verify Changes Saved
- You should see a success message
- The template is now updated

---

## Example Email Template (Reference)

The complete "Confirm signup" template should look similar to:

```
<h2>Confirm your signup</h2>

<p>Follow this link to confirm your user:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Confirm your email</a></p>
```

**Key parts:**
- `{{ .SiteURL }}` = Your production URL (automatically set to https://wirtschaftlichkeitsplan.vercel.app)
- `/auth/confirm` = The route we created to handle confirmation
- `token_hash={{ .TokenHash }}` = The secure confirmation token
- `type=email` = Specifies this is an email confirmation

---

## Testing the Setup

After updating the template:

1. **Go to:** https://wirtschaftlichkeitsplan.vercel.app/signup
2. **Enter test data:**
   - Praxisname: Test Praxis
   - Email: your-test-email@example.com
   - Password: SecureTest123!

3. **Check your email** for confirmation link
4. **Click the link** in the confirmation email
5. **Verify:**
   - You're redirected to the dashboard (or login page)
   - No 404 errors
   - No localhost redirects

---

## Troubleshooting

### Issue: Still getting 404 on datenschutz
**Status:** ✅ Fixed in latest deployment (b671b4e)
- The privacy policy page is now deployed
- May need to hard-refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

### Issue: Email template changes not taking effect
1. Wait 5 minutes for Supabase to apply changes
2. Try sending another test email
3. Check your spam/promotions folder

### Issue: Confirmation link still redirects to localhost
1. Verify you updated the template correctly (no typos)
2. Check that you saved the changes
3. Clear browser cache and try again

### Issue: Can't find Email Templates in dashboard
1. Make sure you're in the right project
2. Go to **Authentication** → **Email Templates** (not just Auth)
3. You might need to scroll in the templates list

---

## What Happens After User Confirms Email

1. User clicks confirmation link → `/auth/confirm` route
2. Route exchanges the token for a session
3. User is redirected to `/dashboard`
4. User can now use all features

---

## Security Notes

✅ **Secure by default:**
- Tokens expire after 24 hours
- Tokens are single-use only
- HTTPS encryption for all transfers
- No user data exposed in URLs

---

## Summary of All Changes Made

| File | Change | Status |
|------|--------|--------|
| `/app/auth/confirm/route.ts` | Created auth confirmation handler | ✅ Deployed |
| `/app/error/page.tsx` | Created error fallback page | ✅ Deployed |
| `/app/datenschutz/page.tsx` | Created privacy policy page | ✅ Deployed |
| `Supabase Email Template` | **NEEDS YOUR ACTION** | 🔴 Pending |

---

## Next Steps

1. **Right now:** Update the Supabase email template (follow instructions above)
2. **Then:** Test signup flow with a real email address
3. **Finally:** You're done! App is fully functional

---

## Questions?

The auth flow is now properly configured. The only remaining step is updating one Supabase template, which takes less than 2 minutes.

**Current Status:**
- ✅ Next.js routes: Created and deployed
- ✅ App structure: Complete
- ✅ Database: Configured
- 🔴 **Email template: Awaiting your manual update in Supabase**

---

*Last Updated: November 6, 2024*
*Deployment: wirtschaftlichkeitsplan.vercel.app*
