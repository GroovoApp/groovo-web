import type { NextConfig } from "next";

const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'https://groovo.venderes.com';
const contentBase = process.env.NEXT_PUBLIC_CONTENT_BASE || 'https://groovo.venderes.com';

const getRemotePatterns = () => {
  const patterns = [
    {
      protocol: 'https' as const,
      hostname: 'picsum.photos',
    },
    {
      protocol: 'https' as const,
      hostname: 'api.dicebear.com',
    },
    {
      protocol: 'https' as const,
      hostname: 'upload.wikimedia.org',
    },
  ];

  // Add API and Content base hostnames dynamically
  [apiBase, contentBase].forEach(url => {
    try {
      const { protocol, hostname, port } = new URL(url);
      const pattern: any = {
        protocol: protocol.replace(':', '') as 'http' | 'https',
        hostname,
      };
      if (port) {
        pattern.port = port;
      }
      // Avoid duplicates
      const isDuplicate = patterns.some(p => 
        p.hostname === hostname && 
        p.protocol === pattern.protocol
      );
      if (!isDuplicate) {
        patterns.push(pattern);
      }
    } catch (e) {
      console.warn(`Invalid URL: ${url}`);
    }
  });

  return patterns;
};

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: getRemotePatterns(),
  },
  /* config options here */
};

export default nextConfig;
