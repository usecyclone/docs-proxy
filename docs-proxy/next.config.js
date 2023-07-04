/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
          /*{
            source: '/:slug*',
            destination: 'https://docs.cedalio.com/:slug*',
          },*/
          {
            source: '/:slug*',
            destination: '/api/cedalio',
          },
        ]
      },
}

module.exports = nextConfig
