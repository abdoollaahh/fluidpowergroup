/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "fluidpowergroup.s3.ap-southeast-2.amazonaws.com",
      "images.unsplash.com",
      "cdn.schema.io",
      "cdn.swell.store" 
    ],
    formats: ['image/webp', 'image/avif'],
  },
  
  // ========================================
  // PHASE 1: URL MIGRATION - PERMANENT REDIRECTS
  // ========================================
  // Old URLs permanently redirect to new URLs
  // This ensures backward compatibility during migration
  async redirects() {
    return [
      // Main buy page redirect
      {
        source: '/buy',
        destination: '/suite360',
        permanent: true
      },
      // Hose360 configurator redirect
      {
        source: '/hosebuilder/hose360',
        destination: '/suite360/hose360',
        permanent: true
      },
      // Trac360 configurator redirects
      {
        source: '/hosebuilder/trac360/start',
        destination: '/suite360/trac360/start',
        permanent: true
      },
      {
        source: '/hosebuilder/trac360/:step',
        destination: '/suite360/trac360/:step',
        permanent: true
      },
      // Function360 (coming soon) redirect
      {
        source: '/hosebuilder/function360',
        destination: '/suite360/function360',
        permanent: true
      },
      // Catch-all for any other hosebuilder paths
      {
        source: '/hosebuilder/:path*',
        destination: '/suite360/:path*',
        permanent: true
      },
      // PWA media assets redirect
      {
        source: '/static/media/:path*',
        destination: '/suite360/static/media/:path*',
        permanent: true
      },
      // Static assets redirect (for PWA scripts/manifest)
      {
        source: '/hosebuilder/static/:path*',
        destination: '/suite360/static/:path*',
        permanent: true
      }
    ]
  },
  
  // Remove old rewrites - no longer needed after folder rename
  // async rewrites() {
  //   return []
  // },
  
  basePath: '',
  assetPrefix: '',
};

module.exports = nextConfig