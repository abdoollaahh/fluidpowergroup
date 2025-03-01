/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "fluidpowergroup.s3.ap-southeast-2.amazonaws.com",
      "images.unsplash.com",
      "cdn.schema.io"
    ],
    unoptimized: true
  },
  
  // For redirects (changing URL in browser)
  async redirects() {
    return [
      {
        source: '/hosebuilder',
        destination: '/buy',
        permanent: true
      }
    ]
  },
  
  // For rewrites (keeping URL in browser but serving different content)
  async rewrites() {
    return [
      {
        source: '/buy',
        destination: '/hosebuilder'
      },
      {
        source: '/buy/:path*',
        destination: '/hosebuilder/:path*'
      },
      {
        source: '/static/media/:path*',
        destination: '/hosebuilder/static/media/:path*'
      }
    ]
  },
  // This ensures static files are served from the correct location
  basePath: '',
  assetPrefix: '',
};

module.exports = nextConfig