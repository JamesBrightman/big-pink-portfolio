"use client";
import { useCallback, useMemo } from "react";
import {
  CellMeasurer,
  CellMeasurerCache,
  Masonry,
  type MasonryCellProps,
} from "react-virtualized";
import type { AssetFile } from "@/lib/assets";
import {
  MASONRY_EDGE_PADDING,
  MASONRY_GUTTER,
  MASONRY_OVERSCAN_PX,
} from "@/components/gallery/galleryConstants";
import { GalleryFooter } from "@/components/gallery/GalleryFooter";
import {
  getAssetHeight,
  getAssetKey,
  getColumnCount,
  getColumnWidth,
} from "@/components/gallery/galleryUtils";
import { createFooterPositioner } from "@/components/gallery/masonryPositioning";
import { MasonryMediaCard } from "@/components/gallery/MasonryMediaCard";

type VirtualizedMasonryContentProps = {
  assets: AssetFile[];
  height: number;
  onOpen: (asset: AssetFile) => void;
  width: number;
};

export function VirtualizedMasonryContent({
  assets,
  height,
  onOpen,
  width,
}: VirtualizedMasonryContentProps) {
  const assetKeys = useMemo(
    () => assets.map((asset, index) => getAssetKey(asset, index)),
    [assets],
  );
  const footerIndex = assets.length;
  const cellCount = assets.length + 1;
  const contentWidth = useMemo(
    () => Math.max(0, width - MASONRY_EDGE_PADDING * 2),
    [width],
  );
  const columnCount = useMemo(
    () => getColumnCount(contentWidth),
    [contentWidth],
  );
  const columnWidth = useMemo(
    () => getColumnWidth(contentWidth, columnCount),
    [columnCount, contentWidth],
  );
  const cache = useMemo(
    () =>
      new CellMeasurerCache({
        defaultHeight:
          assets[0] != null ? getAssetHeight(assets[0], columnWidth) : 220,
        defaultWidth: columnWidth,
        fixedWidth: true,
        keyMapper: (rowIndex) => assetKeys[rowIndex] ?? rowIndex,
      }),
    [assetKeys, assets, columnWidth],
  );
  const positioner = useMemo(
    () =>
      createFooterPositioner({
        cellMeasurerCache: cache,
        columnCount,
        columnWidth,
        footerIndex,
        spacer: MASONRY_GUTTER,
      }),
    [cache, columnCount, columnWidth, footerIndex],
  );

  const cellRenderer = useCallback(
    ({ index, key, parent, style }: MasonryCellProps) => {
      if (index === footerIndex) {
        return (
          <CellMeasurer cache={cache} index={index} key={key} parent={parent}>
            {({ registerChild }) => (
              <div
                ref={registerChild}
                style={{
                  ...style,
                  marginLeft: -MASONRY_EDGE_PADDING,
                  width,
                }}
              >
                <GalleryFooter />
              </div>
            )}
          </CellMeasurer>
        );
      }

      const asset = assets[index];

      if (!asset) {
        return null;
      }

      return (
        <CellMeasurer cache={cache} index={index} key={key} parent={parent}>
          {({ registerChild }) => (
            <div
              ref={registerChild}
              style={{
                ...style,
                width: columnWidth,
              }}
            >
              <div
                style={{
                  boxSizing: "border-box",
                  width: "100%",
                }}
              >
                <MasonryMediaCard asset={asset} onOpen={onOpen} />
              </div>
            </div>
          )}
        </CellMeasurer>
      );
    },
    [assets, cache, columnWidth, footerIndex, onOpen, width],
  );

  return (
    <Masonry
      autoHeight={false}
      className="masonry-scroll-shell"
      key={`${width}-${contentWidth}-${columnCount}-${columnWidth}`}
      cellCount={cellCount}
      cellMeasurerCache={cache}
      cellPositioner={positioner}
      cellRenderer={cellRenderer}
      height={height}
      keyMapper={(index) => assetKeys[index] ?? "gallery-footer"}
      overscanByPixels={MASONRY_OVERSCAN_PX}
      style={{
        boxSizing: "border-box",
        scrollbarGutter: "stable",
      }}
      width={width}
    />
  );
}
