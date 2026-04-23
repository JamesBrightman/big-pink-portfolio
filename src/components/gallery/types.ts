import type { AssetFile, AssetFolder } from "@/lib/assets";

export interface AssetGalleryProps {
  tree: AssetFolder;
  initialPath: string[];
}

export interface MasonryMediaCardProps {
  asset: AssetFile;
  onOpen: (asset: AssetFile) => void;
}

export interface VirtualizedMasonryContentProps {
  assets: AssetFile[];
  height: number;
  onOpen: (asset: AssetFile) => void;
  width: number;
}

export interface VirtualizedMasonryGridProps {
  assets: AssetFile[];
  onOpen: (asset: AssetFile) => void;
}
