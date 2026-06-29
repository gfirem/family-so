import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El cliente de Prisma 7 y los SDK de Node se externalizan en el server.
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"],
  eslint: {
    // El lint se corre aparte; no bloquea el build en Vercel.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
