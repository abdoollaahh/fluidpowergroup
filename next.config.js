/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "fluidpowergroup.s3.ap-southeast-2.amazonaws.com",
      "images.unsplash.com",
      "cdn.schema.io"
    ],
  },
};

module.exports = nextConfig;
