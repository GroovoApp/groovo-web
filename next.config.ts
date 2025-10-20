import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [new URL('https://picsum.photos/**'), new URL('HTTPS://upload.wikimedia.org/**')],
  },
  /* config options here */
};

export default nextConfig;
