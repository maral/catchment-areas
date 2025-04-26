const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["knex", "fs"],
  compiler: {
    styledComponents: true,
  },
  turbopack: {
    rules: {},
  },
};

module.exports = withBundleAnalyzer(nextConfig);
