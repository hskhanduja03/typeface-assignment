/** @type {import('next').NextConfig} */
const nextConfig = {
  // External packages that should not be bundled by Next.js
  serverExternalPackages: ["pdf-parse", "pdf2pic", "canvas"],

  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },

  webpack: (config, { isServer }) => {
    if (isServer) {
      // Handle PDF processing libraries
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
      };

      // Add fallbacks for Node.js modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    return config;
  },
};

module.exports = nextConfig;
