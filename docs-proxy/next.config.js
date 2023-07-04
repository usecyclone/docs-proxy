/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
          {
            source: '/cedalio',
            destination: 'https://docs.cedalio.com',
          },
        ]
      },
}

module.exports = nextConfig
