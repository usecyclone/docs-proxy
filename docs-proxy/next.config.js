/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/",
        destination: "/api/proxy",
      },
      {
        source: "/:slug*",
        destination: "/api/proxy",
      },
    ];
  },
};

module.exports = nextConfig;
