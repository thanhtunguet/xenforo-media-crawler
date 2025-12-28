//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  // Use this to set Nx-specific options
  // See: https://nx.dev/recipes/next/next-config-setup
  nx: {},
  // Enable standalone output for Docker
  output: 'standalone',
  // Proxy API requests to backend in development
  async rewrites() {
    // Only proxy in development mode
    if (process.env.NODE_ENV === 'development') {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
      return [
        {
          source: '/api/:path*',
          destination: `${backendUrl}/api/:path*`,
        },
      ];
    }
    return [];
  },
  // Transpile the contracts package from source
  transpilePackages: ['@xenforo-media-crawler/contracts'],
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
