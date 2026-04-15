import { AssetGallery } from "@/components/asset-gallery";
import { getAssetTree } from "@/lib/assets";

type PortfolioPageProps = {
  initialPath: string[];
};

export async function PortfolioPage({ initialPath }: PortfolioPageProps) {
  const tree = await getAssetTree();

  return (
    <main className="min-h-screen bg-transparent text-white">
      <AssetGallery tree={tree} initialPath={initialPath} />
    </main>
  );
}
