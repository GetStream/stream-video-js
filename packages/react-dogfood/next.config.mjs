/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/.well-known/apple-app-site-association',
        headers: [
          {
            key: 'content-type',
            value: 'application/json',
          },
        ],
      },
    ];
  },

  async rewrites() {
    const coordinatorApiUrl = process.env.STREAM_COORDINATOR_RPC_URL;
    return [
      {
        source: '/rpc/:path*',
        destination: `${coordinatorApiUrl}:path*`
      }
    ]
  }
};

export default nextConfig;
