import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-auth", "@libsql/client", "libsql"],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
