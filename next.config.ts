import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Prisma 7 client and Node SDKs are externalized on the server.
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"],
  eslint: {
    // Linting runs separately; it does not block the build on Vercel.
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Allow large uploads to Server Actions — the PDF recipe-book import
    // (/nutrition/import) sends the whole file; the action itself caps it at 32 MB.
    serverActions: {
      bodySizeLimit: "32mb",
    },
  },
};

export default nextConfig;
