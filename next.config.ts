import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.56.1", "localhost"],

  reactCompiler: true,

  images: {
    qualities: [75, 85, 90, 95],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.timemob.com.br",
      },
      {
        protocol: "https",
        hostname: "timemob-media.s3.us-east-1.amazonaws.com",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
