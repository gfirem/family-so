import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Prisma 7 client and Node SDKs are externalized on the server.
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"],
  eslint: {
    // Linting runs separately; it does not block the build on Vercel.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
