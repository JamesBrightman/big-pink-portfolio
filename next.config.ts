import type { NextConfig } from "next";

const repoName = "big-pink-portfolio";
const isStaticExport = process.env.STATIC_EXPORT === "true";
const repoBasePath = `/${repoName}`;

const nextConfig: NextConfig = {
  reactCompiler: true,
  ...(isStaticExport
    ? {
        output: "export",
        trailingSlash: true,
        basePath: repoBasePath,
        assetPrefix: repoBasePath,
        env: {
          NEXT_PUBLIC_BASE_PATH: repoBasePath,
        },
      }
    : {
        env: {
          NEXT_PUBLIC_BASE_PATH: "",
        },
      }),
};

export default nextConfig;
