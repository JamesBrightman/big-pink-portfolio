"use client";
/* eslint-disable @next/next/no-img-element */
import { type SyntheticEvent, useCallback } from "react";
import type { AssetFile } from "@/lib/assets";
import {
  attemptVideoAutoplay,
  formatAssetYear,
} from "@/components/gallery/galleryUtils";

type MasonryMediaCardProps = {
  asset: AssetFile;
  onOpen: (asset: AssetFile) => void;
};

export function MasonryMediaCard({ asset, onOpen }: MasonryMediaCardProps) {
  const videoAspectRatio =
    typeof asset.width === "number" &&
    typeof asset.height === "number" &&
    asset.width > 0 &&
    asset.height > 0
      ? `${asset.width} / ${asset.height}`
      : "9 / 16";
  const setVideoRef = useCallback((video: HTMLVideoElement | null) => {
    if (!video) {
      return;
    }

    attemptVideoAutoplay(video);
  }, []);
  const handleVideoReady = useCallback(
    (event: SyntheticEvent<HTMLVideoElement>) => {
      attemptVideoAutoplay(event.currentTarget);
    },
    [],
  );

  return (
    <button
      type="button"
      onClick={() => onOpen(asset)}
      className="group relative box-border block w-full appearance-none overflow-hidden rounded-[18px] border border-white/55 bg-white p-0 text-left shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
    >
      {asset.kind === "video" ? (
        <div
          className="relative w-full overflow-hidden bg-black"
          style={{ aspectRatio: videoAspectRatio }}
        >
          <video
            ref={setVideoRef}
            src={asset.src}
            poster={asset.thumbnailSrc}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            onCanPlay={handleVideoReady}
            onLoadedData={handleVideoReady}
            onLoadedMetadata={handleVideoReady}
            className="absolute inset-0 block h-full w-full object-contain bg-black"
          />
        </div>
      ) : (
        <img
          src={asset.thumbnailSrc ?? asset.src}
          alt={asset.name}
          loading="lazy"
          decoding="async"
          width={asset.width}
          height={asset.height}
          className="block h-auto w-full"
        />
      )}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition duration-200 group-hover:opacity-100">
        <div className="max-w-[80%] text-center text-white">
          <p className="text-sm font-semibold tracking-tight">
            {formatAssetYear(asset.date)}
          </p>
          <p className="mt-1 text-sm leading-5 text-white/90">
            {asset.description}
          </p>
        </div>
      </div>
    </button>
  );
}
