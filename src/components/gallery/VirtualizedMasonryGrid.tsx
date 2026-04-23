"use client";
import { AutoSizer } from "react-virtualized";
import type { AssetFile } from "@/lib/assets";
import { MASONRY_EDGE_PADDING } from "@/components/gallery/galleryConstants";
import { VirtualizedMasonryContent } from "@/components/gallery/VirtualizedMasonryContent";

type VirtualizedMasonryGridProps = {
  assets: AssetFile[];
  onOpen: (asset: AssetFile) => void;
};

export function VirtualizedMasonryGrid({
  assets,
  onOpen,
}: VirtualizedMasonryGridProps) {
  return (
    <>
      <div className="-mx-4 min-h-0 flex-1 w-[calc(100%+2rem)]">
        <AutoSizer>
          {({ height, width }) =>
            width > 0 && height > 0 ? (
              <VirtualizedMasonryContent
                assets={assets}
                height={height}
                onOpen={onOpen}
                width={width}
              />
            ) : (
              <div className="min-h-[60vh]" />
            )
          }
        </AutoSizer>
      </div>
      <style jsx global>{`
        .masonry-scroll-shell .ReactVirtualized__Masonry__innerScrollContainer {
          box-sizing: border-box;
          width: calc(100% - ${MASONRY_EDGE_PADDING * 2}px);
          max-width: calc(100% - ${MASONRY_EDGE_PADDING * 2}px);
          margin-left: ${MASONRY_EDGE_PADDING}px;
          overflow: visible !important;
        }
      `}</style>
    </>
  );
}
