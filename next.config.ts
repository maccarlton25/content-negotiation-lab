import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    function markdownRewrite(prefix: string) {
      return {
        source: `${prefix}/:path*`,
        has: [
          {
            type: "header" as const,
            key: "accept",
            value: "(.*)text/markdown(.*)",
          },
        ],
        destination: `${prefix}/md/:path*`,
      };
    }
    return {
      beforeFiles: [
        markdownRewrite("/blog"),
      ],
    };
  },
};

export default nextConfig;
