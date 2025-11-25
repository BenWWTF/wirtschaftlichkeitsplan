# Development Cache-Busting Guide

## Overview

During development, browser caching can cause issues where old code is served instead of your latest changes. This guide explains how to handle caching in your Next.js development environment.

## Automatic Cache-Busting (Configured)

The project is now configured with automatic cache-busting headers that prevent caching during development:

### Cache Headers Configuration

**All Pages** (`/:path*`)
```
Cache-Control: public, max-age=0, must-revalidate
Pragma: no-cache
Expires: 0
```
This ensures pages are never cached and always revalidated with the server.

**API Routes** (`/api/:path*`)
```
Cache-Control: no-cache, no-store, must-revalidate
Pragma: no-cache
Expires: 0
```
API responses are never cached and always fetched fresh.

**Static Assets** (`/_next/static/:path*`)
```
Cache-Control: public, max-age=31536000, immutable
```
Static assets are heavily cached since they have content hashes.

## Manual Cache-Busting

### Browser Hard Refresh

When you need to force a complete cache clear:

**Chrome/Edge/Firefox:**
- Windows: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

**Alternative Method:**
1. Open DevTools (`F12`)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### DevTools Network Tab

To prevent caching while developing:

1. Open Chrome DevTools (`F12`)
2. Go to Network tab
3. Check "Disable cache"
4. This only applies when DevTools is open (doesn't affect normal browsing)

## Development Workflow

### Best Practices

1. **Keep DevTools Open** - With "Disable cache" checked during active development
2. **Use Hot Module Replacement** - Next.js automatically reloads changes (no manual refresh needed for most changes)
3. **Hard Refresh for API Changes** - If API responses seem stale, do a hard refresh
4. **Check Network Tab** - Verify responses show correct cache headers

### Troubleshooting Cache Issues

**Problem: Changes don't appear after saving**

1. Check if DevTools is open with cache disabled
2. Try a hard refresh (`Cmd+Shift+R` on Mac, `Ctrl+Shift+R` on Windows)
3. If still not working, check:
   - Browser console for errors
   - Network tab for response headers
   - Server logs in terminal

**Problem: Old API responses still being used**

1. Hard refresh the page
2. Check that `/api/:path*` headers show `no-cache, no-store, must-revalidate`
3. Verify the API route file was saved correctly

**Problem: Styling changes not appearing**

1. Usually handled by Hot Module Replacement (HMR)
2. If HMR fails, do a hard refresh
3. Check the CSS file is being served from the correct location

## Environment Variables

Cache-busting headers are applied **automatically** in both development and production.

For production, consider adjusting the caching strategy:
- Keep `no-cache` for HTML pages
- Use longer cache durations for static assets
- Implement versioning for API endpoints if needed

## Next.js Specific Features

### On-Demand Entries

The dev server automatically optimizes memory usage:
- Pages are kept in memory for 30 seconds after last access
- Maximum of 5 pages in memory simultaneously
- Unused pages are garbage collected

### File Watching

Webpack watches for file changes:
- Poll interval: 1000ms
- Aggregation timeout: 300ms
- `node_modules` are ignored

### Fast Refresh

Next.js includes Fast Refresh which:
- Preserves component state during edits
- Shows error overlays instantly
- Works for most file types (JS, JSX, TS, TSX, CSS)

## Quick Reference

| Issue | Solution |
|-------|----------|
| Page changes not showing | Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows) |
| API responses stale | Check Network tab, hard refresh, check server logs |
| CSS changes not appearing | Hard refresh (HMR usually handles this) |
| Component state lost | This is normal if the file has errors |
| Multiple npm dev processes | Run `pkill -f "npm run dev"` to kill all, restart |

## For Production Deployment

When deploying to production:

1. **Static assets** are automatically cached (content-hashed)
2. **Pages** use default Next.js caching (ISR/revalidation)
3. **API routes** need explicit cache headers if you want caching
4. **Consider CDN caching** for static assets

Example production override:
```typescript
// In next.config.ts
async headers() {
  if (process.env.NODE_ENV === 'production') {
    return [
      // Production caching rules
    ]
  }
  // Development rules
}
```

## Related Documentation

- [Next.js Cache Documentation](https://nextjs.org/docs/app/building-your-application/caching)
- [HTTP Caching Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
- [Next.js Fast Refresh](https://nextjs.org/docs/architecture/fast-refresh)
