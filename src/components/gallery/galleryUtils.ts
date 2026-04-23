import type { AssetFile, AssetFolder } from "@/lib/assets";
import { MASONRY_GUTTER } from "@/components/gallery/galleryConstants";

export function collectFiles(folder: AssetFolder): AssetFile[] {
  const childFiles = folder.folders.flatMap(collectFiles);

  return [...folder.files, ...childFiles].sort(
    (a, b) => Date.parse(b.date) - Date.parse(a.date),
  );
}

export function formatAssetYear(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function subscribeToHydration() {
  return () => {};
}

export function getColumnWidth(width: number, columnCount: number) {
  return Math.max(
    140,
    Math.floor((width - MASONRY_GUTTER * (columnCount - 1)) / columnCount),
  );
}

export function getColumnCount(width: number) {
  if (width >= 1440) {
    return 6;
  }

  if (width >= 1200) {
    return 5;
  }

  if (width >= 900) {
    return 4;
  }

  if (width >= 640) {
    return 3;
  }

  return 2;
}

export function getAssetHeight(asset: AssetFile, columnWidth: number) {
  if (
    typeof asset.width === "number" &&
    typeof asset.height === "number" &&
    asset.width > 0
  ) {
    return Math.max(
      180,
      Math.round((asset.height / asset.width) * columnWidth),
    );
  }

  return 220;
}

export function getAssetKey(asset: AssetFile, index: number) {
  return `${asset.src}::${index}`;
}

export function attemptVideoAutoplay(video: HTMLVideoElement | null) {
  if (!video) {
    return;
  }

  video.muted = true;
  video.playsInline = true;
  video.loop = true;

  const playback = video.play();

  if (playback && typeof playback.catch === "function") {
    playback.catch(() => {});
  }
}
