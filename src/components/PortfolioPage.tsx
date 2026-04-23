import { AssetGallery } from "@/components/AssetGallery";
import { getAssetTree, type AssetFolder } from "@/lib/assets";

type PortfolioPageProps = {
  initialPath: string[];
  tree?: AssetFolder;
};

export async function PortfolioPage({ initialPath, tree }: PortfolioPageProps) {
  const assetTree = tree ?? (await getAssetTree());

  return (
    <main className="flex min-h-0 flex-1 flex-col bg-transparent text-white">
      <AssetGallery tree={assetTree} initialPath={initialPath} />
    </main>
  );
}
