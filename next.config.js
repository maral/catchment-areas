/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["knex", "fs"],
  rewrites: async () => {
    return {
      beforeFiles: [
        {
          source: "/_next/static/chunks/app/:folder/@breadcrumb/:path*",
          destination: "/_next/static/chunks/app/:folder/%40breadcrumb/:path*",
        },
      ],
    };
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/zs',
        permanent: true,
      },
    ]
  },
};

module.exports = nextConfig;
