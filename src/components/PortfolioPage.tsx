import { AssetGallery } from "@/components/gallery/AssetGallery";
import { getAssetTree } from "@/lib/assets";
import type { PortfolioPageProps } from "@/components/types";

export async function PortfolioPage({ initialPath, tree }: PortfolioPageProps) {
  const assetTree = tree ?? (await getAssetTree());

  return (
    <main className="flex min-h-0 flex-1 flex-col bg-transparent text-white">
      <AssetGallery tree={assetTree} initialPath={initialPath} />
    </main>
  );
}
