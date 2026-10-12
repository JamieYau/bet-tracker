import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The development badge overlaps the mobile Dashboard link.
  devIndicators: false,
  outputFileTracingExcludes: { "/*": ["./.local/**/*"] },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
