/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/",
        destination: "/api/cedalio",
      },
      {
        source: "/:slug*",
        destination: "/api/cedalio",
      },
    ];
  },
};

module.exports = nextConfig;
