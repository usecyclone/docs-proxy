/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
          {
            source: '/:slug*',
            destination: 'https://docs.cedalio.com/:slug*',
          },
        ]
      },
}

module.exports = nextConfig
