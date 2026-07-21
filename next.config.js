/** @type {import('next').NextConfig} */
const nextConfig = {
  // Self-contained server bundle: deploy (Task 21) rsyncs .next/standalone to
  // EC2 and runs its server.js under PM2 — the box's node_modules serve only
  // the Express API, never the web app.
  output: 'standalone',
  poweredByHeader: false,
  compiler: {
    // Official styled-components transform: stable classnames + SSR support
    // (pairs with lib/StyledComponentsRegistry.jsx from Task 7).
    styledComponents: true,
  },
  async redirects() {
    return [
      // Old hyphenated URL. permanent:true emits HTTP 308 when :3000 is hit
      // directly; live nginx keeps answering 301 in front of it, and the
      // parity allowlist covers the direct-:3000 status difference (Task 18).
      { source: '/garage-makeover', destination: '/garagemakeover', permanent: true },
    ];
  },
  async rewrites() {
    // Dev convenience only (replaces CRA's "proxy" field): lets `next dev`
    // forward API calls to the local Express server. In prod nginx intercepts
    // /api/* before requests ever reach Next.
    return [
      { source: '/api/:path*', destination: 'http://127.0.0.1:4242/api/:path*' },
    ];
  },
};

module.exports = nextConfig;
