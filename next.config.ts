import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["imapflow", "pg", "@electric-sql/pglite"],
  allowedDevOrigins: ["*.e2b.app"],
  images: { unoptimized: true },
};

export default nextConfig;
