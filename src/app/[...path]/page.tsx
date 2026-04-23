import { notFound } from "next/navigation";
import { PortfolioPage } from "@/components/PortfolioPage";
import {
  collectFolderPaths,
  findFolderByPath,
  getAssetTree,
} from "@/lib/assets";

type RouteProps = {
  params: Promise<{
    path?: string[];
  }>;
};

export async function generateStaticParams() {
  const tree = await getAssetTree();
  return collectFolderPaths(tree)
    .filter((pathSegments) => pathSegments.length > 0)
    .map((pathSegments) => ({
      path: pathSegments,
    }));
}

export default async function CatchAllPage({ params }: RouteProps) {
  const { path = [] } = await params;
  const tree = await getAssetTree();

  if (path.length > 0 && !findFolderByPath(tree, path)) {
    notFound();
  }

  return <PortfolioPage initialPath={path} tree={tree} />;
}
