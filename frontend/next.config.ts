import type { NextConfig } from "next";

const basePath = process.env.BASE_PATH ?? "";
const assetPrefix = basePath ? `${basePath}/` : undefined;

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
