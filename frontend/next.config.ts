import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/:path*/',  // Added trailing slash
  //       destination: 'http://127.0.0.1:8000/api/:path*/',
  //     },
  //     {
  //       source: '/api/:path*',  // Without trailing slash - redirect to with slash
  //       destination: 'http://127.0.0.1:8000/api/:path*/',
  //     },
  //   ];
  // },
};

export default nextConfig;
