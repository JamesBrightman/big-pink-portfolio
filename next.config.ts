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
          NEXT_PUBLIC_ENABLE_LOCAL_UPLOAD: "false",
        },
      }
    : {
        env: {
          NEXT_PUBLIC_BASE_PATH: "",
          NEXT_PUBLIC_ENABLE_LOCAL_UPLOAD: "true",
        },
      }),
};

export default nextConfig;
