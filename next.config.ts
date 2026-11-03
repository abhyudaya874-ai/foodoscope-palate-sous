import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false, // hide the dev badge in demos
  // serverless: bundle the files the routes read at runtime (fixtures, CSVs, budget)
  outputFileTracingIncludes: {
    "/api/run": ["fixtures/**"],
    "/api/run/[id]/stream": ["fixtures/**"],
    "/api/sources": ["workspace/data/**", "fixtures/search-cache/**"],
  },
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
