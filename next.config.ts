import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    tsconfigPath: './tsconfig.json'
  },

  // Development optimization with cache-busting headers
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 30 * 1000,
    // Number of pages that should be kept simultaneously in memory
    pagesBufferLength: 5,
  },

  // Headers with environment-aware caching
  async headers() {
    const isDev = process.env.NODE_ENV === 'development'
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: isDev ? 'public, max-age=0, must-revalidate' : 'public, max-age=3600, must-revalidate',
          },
          ...(isDev ? [
            {
              key: 'Pragma',
              value: 'no-cache',
            },
            {
              key: 'Expires',
              value: '0',
            },
          ] : []),
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://maps.googleapis.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://tessdata.projectnaptha.com; worker-src 'self' blob: https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  // Turbopack configuration for Next.js 16+
  turbopack: {
    resolveAlias: {
      '@': './',
    },
  },
}

export default nextConfig
