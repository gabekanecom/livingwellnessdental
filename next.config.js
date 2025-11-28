/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.digitaloceanspaces.com',
      },
      {
        protocol: 'https',
        hostname: 'lwd-app.sfo3.cdn.digitaloceanspaces.com',
      },
    ],
  },
}

module.exports = nextConfig
