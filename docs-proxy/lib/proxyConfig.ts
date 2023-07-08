// the main site should use Vercel Edge Config
// this is used for fallback
export const proxyHosts: { [host: string]: string } = {
  "docs.cedalio.com": "https://gitbook.cedalio.com",
  "cedalio.usecyclone.dev": "https://docs.cedalio.com",
  "cedalio-docs-proxy.vercel.app": "https://gitbook.cedalio.com",
  "convex.usecyclone.dev": "https://docs.convex.dev",
  "continue.usecyclone.dev": "https://continue.dev",
};

export default proxyHosts;
