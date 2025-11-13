# Phase 8 Implementation Plan
## Production Deployment & DevOps Setup

**Date:** November 13, 2025
**Scope:** Vercel deployment, CI/CD pipeline, monitoring, error tracking, analytics

---

## 🎯 Phase 8 Goals

1. **Deploy to Vercel** - Production-ready hosting with auto-scaling
2. **Setup CI/CD Pipeline** - Automated testing and deployments
3. **Error Tracking** - Implement Sentry for error monitoring
4. **Performance Monitoring** - Track Core Web Vitals and user experience
5. **Analytics** - Understand user behavior and feature usage
6. **Security Hardening** - Final security checks and compliance

---

## 🚀 Vercel Deployment

### Step 1: Prepare for Deployment

#### A. Environment Variables
Create `.env.production` with:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
DATABASE_URL=your-database-url
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-domain.com
SENTRY_AUTH_TOKEN=your-sentry-token
```

#### B. Optimize Configuration
```typescript
// next.config.ts
export default {
  // Enable optimizations
  productionBrowserSourceMaps: false,
  compress: true,
  swcMinify: true,
  optimizeFonts: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  // Security headers
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
      ],
    },
  ],
}
```

### Step 2: Vercel Setup

#### A. Connect GitHub Repository
1. Go to vercel.com and sign in
2. Click "Add New" → "Project"
3. Select GitHub repository
4. Configure project settings:
   - Framework: Next.js
   - Root Directory: ./
   - Build command: `npm run build`
   - Output directory: `.next`

#### B. Environment Variables in Vercel
```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=...
NEXTAUTH_SECRET=... (generate with: openssl rand -base64 32)
NEXTAUTH_URL=https://your-domain.vercel.app
```

#### C. Custom Domain Setup
1. In Vercel Settings → Domains
2. Add custom domain (e.g., wirtschaftlichkeitsplan.de)
3. Update DNS records to point to Vercel
4. Enable HTTPS (automatic)

### Step 3: Deployment Preview

```
Deployment Workflow:
┌─ Feature Branch ──→ Preview Deployment ──→ Review & Test
│
└─ Pull Request ────→ Automatic Tests ─────→ Approval
│
└─ Main Branch ─────→ Production Deploy ───→ Live (Auto-scaling)
```

### Vercel Settings

#### Preview Deployments
```yaml
# .vercel/project.json
{
  "name": "wirtschaftlichkeitsplan",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "functions": {
    "api/**": {
      "maxDuration": 60
    }
  }
}
```

#### Auto-scaling Configuration
- **Memory:** 3008 MB default
- **CPU:** Intel (Premium)
- **Concurrency:** Auto
- **Region:** Automatic (closest to user)

---

## 🔄 CI/CD Pipeline with GitHub Actions

### Step 1: Create Workflow Files

#### A. Testing Workflow (.github/workflows/test.yml)
```yaml
name: Tests
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm install

      - name: Run linting
        run: npm run lint

      - name: Type checking
        run: npm run type-check

      - name: Run tests
        run: npm run test

      - name: Build production
        run: npm run build

      - name: Run E2E tests
        run: npm run test:e2e
        if: success()

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        if: success()
```

#### B. Security Workflow (.github/workflows/security.yml)
```yaml
name: Security Checks
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Dependency audit
        run: npm audit --production

      - name: SAST scanning
        run: npm run lint -- --max-warnings 0

      - name: Secrets scanning
        uses: gitleaks/gitleaks-action@v2
```

#### C. Deploy Workflow (.github/workflows/deploy.yml)
```yaml
name: Deploy
on:
  push:
    branches: [main]
  workflow_run:
    workflows: [Tests]
    types: [completed]

jobs:
  deploy:
    if: github.event.workflow_run.conclusion == 'success'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@v5
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          production: true

      - name: Notify deployment
        uses: slackapi/slack-github-action@v1
        if: always()
        with:
          payload: |
            {
              "text": "Deployment: ${{ job.status }}",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "Wirtschaftlichkeitsplan *${{ job.status }}*"
                  }
                }
              ]
            }
```

### Step 2: Setup GitHub Secrets
```bash
VERCEL_TOKEN=         # From vercel.com/account/tokens
VERCEL_ORG_ID=        # From Vercel project settings
VERCEL_PROJECT_ID=    # From Vercel project settings
SENTRY_AUTH_TOKEN=    # From sentry.io
SLACK_WEBHOOK=        # For notifications
```

### Step 3: Deployment Checklist

```yaml
# .github/DEPLOYMENT_CHECKLIST.md
- [ ] All tests pass
- [ ] Code review approved
- [ ] No breaking changes
- [ ] Database migrations planned
- [ ] Environment variables configured
- [ ] Monitoring setup complete
- [ ] Backup/rollback plan ready
- [ ] Communication sent to team
```

---

## 🔍 Error Tracking with Sentry

### Step 1: Setup Sentry

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### Step 2: Configure Sentry
```typescript
// sentry.server.config.ts
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
})
```

### Step 3: Error Handling
```typescript
// lib/actions/example.ts
import * as Sentry from "@sentry/nextjs"

export async function criticalAction(data: unknown) {
  try {
    // Do something
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        action: "criticalAction",
        severity: "high",
      },
      contexts: {
        data: { input: data },
      },
    })
    throw error
  }
}
```

### Step 4: Sentry Dashboard
- Monitor error rates
- Track performance metrics
- Set up alerting
- Create custom dashboards
- Analyze user sessions

---

## 📊 Performance Monitoring

### Option 1: Vercel Analytics (Recommended for Next.js)

```typescript
// app/layout.tsx
import { Analytics } from "@vercel/analytics/react"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### Option 2: Data Dog

```bash
npm install -D @datadog/browser-rum @datadog/browser-logs
```

```typescript
// Initialize in root component
import { datadogRum } from '@datadog/browser-rum'

datadogRum.init({
  applicationId: process.env.NEXT_PUBLIC_DD_APP_ID,
  clientToken: process.env.NEXT_PUBLIC_DD_CLIENT_TOKEN,
  site: 'datadoghq.com',
  service: 'wirtschaftlichkeitsplan',
  env: process.env.NODE_ENV,
  sessionSampleRate: 100,
  sessionReplaySampleRate: 20,
  trackUserInteractions: true,
  trackResources: true,
  trackLongTasks: true,
})

datadogRum.startSessionReplayRecording()
```

### Option 3: New Relic

```bash
npm install @newrelic/browser-agent
```

```typescript
// Initialize browser agent
import { agent } from '@newrelic/browser-agent'

agent.start({
  init: {
    ajax: { enabled: true },
    session_trace: { enabled: true },
    session_replay: { enabled: true },
  },
  loaderScript: '/nr-loader.js',
  accountID: process.env.NEXT_PUBLIC_NR_ACCOUNT_ID,
  agentID: process.env.NEXT_PUBLIC_NR_AGENT_ID,
  trustKey: process.env.NEXT_PUBLIC_NR_TRUST_KEY,
  licenseKey: process.env.NEXT_PUBLIC_NR_LICENSE_KEY,
  applicationID: process.env.NEXT_PUBLIC_NR_APP_ID,
})
```

---

## 📈 Analytics with Posthog or Mixpanel

### Posthog Setup
```bash
npm install posthog-js
```

```typescript
// app/layout.tsx
'use client'

import { PostHogProvider } from 'posthog-js/react'
import posthog from 'posthog-js'

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    loaded: (ph) => {
      if (process.env.NODE_ENV === 'development') ph.debug()
    },
  })
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider client={posthog}>
      {children}
    </PostHogProvider>
  )
}
```

### Key Events to Track
```typescript
// lib/analytics/events.ts
import posthog from 'posthog-js'

export const analyticsEvents = {
  // Authentication
  signUp: (method: string) =>
    posthog.capture('sign_up', { method }),
  login: (method: string) =>
    posthog.capture('login', { method }),

  // Therapies
  createTherapy: (data: any) =>
    posthog.capture('create_therapy', data),
  updateTherapy: (id: string) =>
    posthog.capture('update_therapy', { therapy_id: id }),
  deleteTherapy: (id: string) =>
    posthog.capture('delete_therapy', { therapy_id: id }),

  // Planning
  createPlan: (month: string) =>
    posthog.capture('create_plan', { month }),
  updatePlan: (planId: string) =>
    posthog.capture('update_plan', { plan_id: planId }),

  // Reports
  generateReport: (type: string) =>
    posthog.capture('generate_report', { report_type: type }),
  exportReport: (format: string) =>
    posthog.capture('export_report', { format }),

  // Analysis
  viewBreakEven: () =>
    posthog.capture('view_break_even'),
  viewAnalytics: () =>
    posthog.capture('view_analytics'),
}
```

---

## 🔐 Security Hardening

### Step 1: Security Headers

```typescript
// next.config.ts
export default {
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'",
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'Permissions-Policy',
          value: 'geolocation=(), microphone=(), camera=()',
        },
      ],
    },
  ],
}
```

### Step 2: HTTPS & SSL
- ✅ Automatic with Vercel
- ✅ Certificate auto-renewal
- ✅ Custom domain SSL included

### Step 3: Rate Limiting
```typescript
// lib/middleware/rate-limit.ts
import { RateLimiter } from 'limiter'

const limiter = new RateLimiter({
  tokensPerInterval: 100,
  interval: 'minute',
})

export async function checkRateLimit(identifier: string) {
  const remaining = await limiter.removeTokens(1)
  return remaining >= 0
}
```

### Step 4: CORS Configuration
```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  response.headers.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  return response
}
```

---

## 📋 Phase 8 Deployment Checklist

### Pre-Deployment (1 week before)
- [ ] All Phase 7 tests passing
- [ ] Code review completed
- [ ] Security audit passed
- [ ] Database migrations tested
- [ ] Backup procedure documented
- [ ] Rollback plan prepared
- [ ] Team communication sent
- [ ] Documentation updated

### Deployment Day
- [ ] Database backup created
- [ ] Environment variables verified
- [ ] Sentry project created
- [ ] Analytics configured
- [ ] Monitoring dashboards created
- [ ] Alert rules configured
- [ ] Deploy to production
- [ ] Smoke tests run
- [ ] Monitor error rates

### Post-Deployment (1 week after)
- [ ] Monitor performance metrics
- [ ] Check error reports
- [ ] Analyze user analytics
- [ ] Gather user feedback
- [ ] Document any issues
- [ ] Plan optimization work
- [ ] Schedule follow-up review

---

## 🔄 Continuous Deployment Strategy

### Environment Tiers
```
Development → Staging → Production
    ↓          ↓          ↓
Local Test   Full QA    Live Users
```

### Deployment Process
```yaml
1. Push to GitHub
   ↓
2. CI Pipeline Runs
   - Lint, Type Check, Test, Build
   ↓
3. Create Preview Deployment
   - Full staging environment
   - Run E2E tests
   ↓
4. Merge to Main
   - Code review approval required
   ↓
5. Automatic Deployment to Production
   - Auto-scaling enabled
   - Monitoring active
   - Rollback ready
```

### Rollback Procedure
```bash
# Quick rollback in Vercel UI
# Or via CLI:
vercel rollback production

# Or manual:
git revert <commit-hash>
git push
# CI/CD auto-deploys
```

---

## 📊 Post-Deployment Monitoring

### KPIs to Track
- **Uptime:** >99.5%
- **Error Rate:** <0.1%
- **Page Load Time:** <2s
- **API Response:** <200ms
- **Database:** <100ms query
- **User Retention:** >60%
- **Feature Adoption:** >70%

### Daily Checks
```bash
# Automated daily report
- Error count (Sentry)
- Performance metrics (Vercel)
- User activity (Posthog)
- Database performance
- API response times
- Server logs
```

---

## 🎓 Team Training

### Before Going Live
- [ ] All team members trained on production environment
- [ ] Incident response procedures documented
- [ ] On-call rotation established
- [ ] Communication channels setup
- [ ] Escalation procedures defined

---

## 📚 References

- [Vercel Deployment Guide](https://vercel.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Sentry Documentation](https://docs.sentry.io)
- [OWASP Security Best Practices](https://owasp.org/Top10)
- [Next.js Production Checklist](https://nextjs.org/docs/going-to-production)

---

## 🚀 Timeline

### Week 1-2: Vercel Setup
- [ ] Prepare environment variables
- [ ] Setup custom domain
- [ ] Configure preview deployments
- [ ] Test deployment process

### Week 3: CI/CD Pipeline
- [ ] Create GitHub Actions workflows
- [ ] Setup security scanning
- [ ] Configure auto-deployments
- [ ] Test rollback procedure

### Week 4: Monitoring & Analytics
- [ ] Setup Sentry
- [ ] Configure performance monitoring
- [ ] Integrate analytics
- [ ] Create monitoring dashboards

### Week 5: Security Hardening
- [ ] Final security audit
- [ ] Configure security headers
- [ ] Setup rate limiting
- [ ] Document security procedures

---

**Status:** Ready to begin Phase 8 after Phase 7 completion
**Timeline:** 4-5 weeks for full production readiness
**Success Criteria:** 99.5% uptime, <0.1% error rate, all monitoring active

---

*Implementation Plan for Phase 8*
*November 13, 2025*
