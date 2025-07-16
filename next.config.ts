import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // 在build时忽略TypeScript错误
    ignoreBuildErrors: true,
  },
  eslint: {
    // 在build时忽略ESLint错误
    ignoreDuringBuilds: true,
  },
  experimental: {
    // 确保 Prisma 正常工作
    serverComponentsExternalPackages: ['prisma', '@prisma/client'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        port: '',
        pathname: '/t/p/**',
      },
      {
        protocol: 'https',
        hostname: `${process.env.OSS_BUCKET_NAME}.${process.env.OSS_REGION}.aliyuncs.com`,
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // 在客户端禁用这些 Node.js 模块
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        buffer: false,
        util: false,
        querystring: false,
      };

      // 完全忽略 ali-oss 和相关模块
      config.resolve.alias = {
        ...config.resolve.alias,
        'ali-oss': false,
        'urllib': false,
        'proxy-agent': false,
      };
    }
    return config;
  },
  serverExternalPackages: ['ali-oss'],
};

export default nextConfig;
