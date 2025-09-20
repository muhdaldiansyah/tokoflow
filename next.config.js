// next.config.js
const isTurbopack = process.env.TURBOPACK === '1';

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },

  // Only apply Webpack tweaks when NOT using Turbopack
  ...(isTurbopack
    ? {
        turbopack: {
          // optional turbopack config (aliases, rules) goes here
        },
      }
    : {
        webpack(config, ctx) {
          // your existing webpack-only customizations
          config.resolve.extensions = ['.js', '.jsx', '.ts', '.tsx', '.json'];
          return config;
        },
      }),
};

module.exports = nextConfig;
