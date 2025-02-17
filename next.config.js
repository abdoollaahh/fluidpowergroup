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
  async rewrites() {
    return [
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