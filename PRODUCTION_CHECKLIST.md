# Production Checklist - Wirtschaftlichkeitsplan

Complete this checklist before deploying to production.

## Code Quality ✅

- [x] All TypeScript errors resolved
- [x] All ESLint warnings addressed
- [x] Build completes successfully (`pnpm build`)
- [x] No console errors in browser
- [x] All routes tested locally
- [x] Responsive design verified on mobile/tablet/desktop
- [x] Dark mode works correctly

## Security ✅

- [x] No hardcoded secrets in code
- [x] `.env.local.example` contains only placeholders
- [x] `.env.local` and `.env.production.local` in `.gitignore`
- [x] Supabase RLS policies configured
- [x] Authentication checks on all protected routes
- [x] SQL injection protection via parameterized queries
- [x] CORS headers configured for Supabase
- [x] Rate limiting considered for auth

## Performance ✅

- [x] Build size optimized (227 kB for largest route)
- [x] Images optimized with Next.js Image component
- [x] Code splitting working (separate chunks)
- [x] Lazy loading on charts and heavy components
- [x] Database queries optimized
- [x] No N+1 query problems

## Database ✅

- [x] Schema created with migrations
- [x] Indexes created on frequently queried columns
- [x] RLS policies implemented and tested
- [x] Foreign key constraints in place
- [x] Backup strategy defined
- [x] Migration tested on fresh database

## Deployment Infrastructure

### Vercel

- [ ] Account created and verified
- [ ] GitHub repository created and connected
- [ ] Build settings configured
- [ ] Environment variables added (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
- [ ] Custom domain configured (optional)
- [ ] Deployment preview URLs working
- [ ] Production deployment successful

### Supabase

- [ ] Project created
- [ ] Database initialized
- [ ] Migrations applied
- [ ] Auth providers configured
- [ ] Redirect URLs added to authentication settings
- [ ] Backups configured
- [ ] Usage limits verified
- [ ] API keys generated and stored securely

## Testing Before Deployment

### Authentication Flow
- [ ] Sign up with email works
- [ ] Login with existing account works
- [ ] Logout clears session
- [ ] Redirect to login on unauthenticated access
- [ ] Password reset works (if implemented)

### Core Features
- [ ] Therapy management (create, read, update, delete)
- [ ] Monthly planning (create and save plans)
- [ ] Break-even calculations display correctly
- [ ] Charts render with data
- [ ] Reports show correct calculations
- [ ] Dark mode toggle works

### Data Validation
- [ ] Form validation works
- [ ] Error messages display correctly
- [ ] Toast notifications appear
- [ ] Date formatting is correct (de-AT format)
- [ ] Currency formatting is correct (€)

### Cross-Browser Testing
- [ ] Chrome/Chromium works
- [ ] Firefox works
- [ ] Safari works
- [ ] Mobile browsers work

## Documentation ✅

- [x] README.md with project overview
- [x] SETUP_GUIDE.md with installation instructions
- [x] DEPLOYMENT_GUIDE.md with deployment steps
- [x] START_HERE.md with getting started guide
- [x] QUICK_REFERENCE.md with common commands
- [x] PROJECT_STATUS.md with feature status
- [x] Code comments on complex functions
- [x] TypeScript types well documented

## Monitoring & Analytics

### Setup
- [ ] Vercel Analytics enabled
- [ ] Error tracking configured (optional: Sentry, etc.)
- [ ] Database monitoring enabled in Supabase
- [ ] Uptime monitoring configured (optional: Uptimerobot, etc.)

### Alerts
- [ ] Deployment failures alert configured
- [ ] Error rate alerts configured
- [ ] Database quota alerts configured
- [ ] Performance regression alerts (optional)

## Post-Deployment

### First 24 Hours
- [ ] Monitor error logs
- [ ] Check Vercel analytics
- [ ] Verify all features working
- [ ] Test authentication flow
- [ ] Check email/notifications if applicable

### First Week
- [ ] Monitor performance metrics
- [ ] Check database usage
- [ ] Review user feedback
- [ ] Prepare incident response procedure
- [ ] Document any issues found

### Ongoing
- [ ] Regular security updates
- [ ] Monitor dependencies for vulnerabilities
- [ ] Review and optimize slow queries
- [ ] Backup verification
- [ ] Performance monitoring

## Rollback Plan

### If Something Goes Wrong

1. **Vercel Rollback**
   - Go to Vercel Dashboard → Deployments
   - Select previous stable version
   - Click "Redeploy"
   - Takes effect immediately

2. **Database Rollback**
   - Supabase Dashboard → Backups
   - Select backup point
   - Restore (test on development first)

3. **Communication**
   - Notify affected users
   - Post status update
   - Document issue for post-mortem

## Success Criteria

Your deployment is successful when:

✅ Application loads without errors
✅ All authentication flows work
✅ All data operations (CRUD) work
✅ Charts and calculations display correctly
✅ No console errors in production
✅ Response times acceptable (<2s)
✅ Mobile view responsive and functional
✅ Dark mode toggle works

## Sign-Off

- [ ] Developer: Code reviewed and tested
- [ ] QA: All features verified
- [ ] Product: Ready for production
- [ ] Deployment: All checks passed

**Deployment Date**: _______________

**Deployed By**: _______________

**Notes**: _______________

---

## Key Contacts & Resources

- **Vercel Support**: https://vercel.com/help
- **Supabase Support**: https://supabase.com/docs
- **Incident Response**: [Prepare contact list]
- **On-Call Schedule**: [If applicable]

## Maintenance Windows

Recommended maintenance windows:
- Security patches: As needed
- Database maintenance: Off-peak hours (e.g., 2-4 AM)
- Feature deployments: [Your team's preference]

---

**Last Updated**: 2024
**Version**: 1.0
