const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["knex", "fs"],
  },
  compiler: {
    styledComponents: true,
  },
};

module.exports = withBundleAnalyzer(nextConfig);
