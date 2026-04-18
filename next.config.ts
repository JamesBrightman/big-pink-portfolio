import type { NextConfig } from "next";

const repoName = "big-pink-portfolio";
const isStaticExport = process.env.STATIC_EXPORT === "true";
const useRepoSubpath = process.env.GITHUB_PAGES_REPO_SUBPATH === "true";
const repoBasePath = `/${repoName}`;
const staticBasePath = useRepoSubpath ? repoBasePath : "";

const nextConfig: NextConfig = {
  reactCompiler: true,
  ...(isStaticExport
    ? {
        output: "export",
        trailingSlash: true,
        ...(staticBasePath
          ? {
              basePath: staticBasePath,
              assetPrefix: staticBasePath,
            }
          : {}),
        env: {
          NEXT_PUBLIC_BASE_PATH: staticBasePath,
          NEXT_PUBLIC_ENABLE_LOCAL_UPLOAD: "false",
          NEXT_PUBLIC_LOCAL_UPLOAD_HELPER_URL: "",
        },
      }
    : {
        env: {
          NEXT_PUBLIC_BASE_PATH: "",
          NEXT_PUBLIC_ENABLE_LOCAL_UPLOAD: "true",
          NEXT_PUBLIC_LOCAL_UPLOAD_HELPER_URL: "http://127.0.0.1:3210",
        },
      }),
};

export default nextConfig;
