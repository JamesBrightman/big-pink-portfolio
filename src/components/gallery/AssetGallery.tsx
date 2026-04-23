"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { AssetFile, AssetFolder } from "@/lib/assets";
import { HomeIcon } from "@/components/icons/HomeIcon";
import {
  attemptVideoAutoplay,
  collectFiles,
  formatAssetYear,
  subscribeToHydration,
} from "@/components/gallery/galleryUtils";
import { VirtualizedMasonryGrid } from "@/components/gallery/VirtualizedMasonryGrid";
import { MobileNav } from "@/components/nav/MobileNav";
import { NavFolderItem } from "@/components/nav/NavFolderItem";

type AssetGalleryProps = {
  tree: AssetFolder;
  initialPath: string[];
};

export function AssetGallery({ tree, initialPath }: AssetGalleryProps) {
  const hasMounted = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetFile | null>(null);
  const activePath = initialPath;
  let activeFolder = tree;

  for (const segment of activePath) {
    const next = activeFolder.folders.find((folder) => folder.name === segment);

    if (!next) {
      activeFolder = tree;
      break;
    }

    activeFolder = next;
  }

  const assets = useMemo(() => collectFiles(activeFolder), [activeFolder]);

  useEffect(() => {
    if (!selectedAsset && !isMobileNavOpen) {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedAsset(null);
        setIsMobileNavOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isMobileNavOpen, selectedAsset]);

  return (
    <section className="flex min-h-0 flex-1 flex-col px-4 pt-5">
      <header className="relative z-50 mb-1 bg-transparent">
        <div className="overflow-hidden lg:overflow-visible">
          <nav className="flex items-center justify-between bg-transparent px-0 pb-2">
            <Link
              href="/"
              aria-label="Home"
              className={`relative flex items-center justify-center pb-3 transition ${
                activePath.length === 0
                  ? "text-white italic"
                  : "text-white/85 hover:text-white"
              }`}
            >
              <HomeIcon />
            </Link>

            <div className="hidden flex-wrap items-center justify-end gap-8 lg:flex">
              {tree.folders.map((folder) => (
                <NavFolderItem
                  key={folder.name}
                  folder={folder}
                  pathSegments={[folder.name]}
                  activePath={activePath}
                />
              ))}
            </div>

            <MobileNav
              tree={tree}
              activePath={activePath}
              isOpen={isMobileNavOpen}
              onOpen={() => setIsMobileNavOpen(true)}
              onClose={() => setIsMobileNavOpen(false)}
            />
          </nav>
        </div>
      </header>

      {hasMounted ? (
        <VirtualizedMasonryGrid
          assets={assets}
          onOpen={setSelectedAsset}
        />
      ) : (
        <div className="min-h-[60vh]" />
      )}

      {selectedAsset ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-2 py-0 sm:p-4"
          onClick={() => setSelectedAsset(null)}
        >
          <div
            className="flex max-h-dvh w-full max-w-full flex-col items-center overflow-y-auto sm:max-h-[calc(100dvh-2rem)] sm:w-auto sm:max-w-[calc(100vw-2rem)] sm:pr-3"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex min-h-0 w-full items-center justify-center sm:w-auto">
              {selectedAsset.kind === "video" ? (
                <video
                  ref={attemptVideoAutoplay}
                  src={selectedAsset.src}
                  poster={selectedAsset.thumbnailSrc}
                  autoPlay
                  controls
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  onCanPlay={(event) =>
                    attemptVideoAutoplay(event.currentTarget)
                  }
                  onLoadedData={(event) =>
                    attemptVideoAutoplay(event.currentTarget)
                  }
                  onLoadedMetadata={(event) =>
                    attemptVideoAutoplay(event.currentTarget)
                  }
                  className="max-h-[calc(100dvh-6.5rem)] max-w-full rounded-[18px] object-contain sm:max-h-[calc(100dvh-2rem)] sm:max-w-[calc(100vw-2rem)]"
                />
              ) : (
                <img
                  src={selectedAsset.src}
                  alt={selectedAsset.name}
                  decoding="async"
                  className="max-h-[calc(100dvh-6.5rem)] max-w-full rounded-[18px] object-contain sm:max-h-[calc(100dvh-2rem)] sm:max-w-[calc(100vw-2rem)]"
                />
              )}
            </div>

            <div className="mt-4 w-full text-center text-white lg:hidden">
              <p className="text-sm font-semibold tracking-tight">
                {formatAssetYear(selectedAsset.date)}
              </p>
              <p className="mt-1 text-sm leading-5 text-white/90">
                {selectedAsset.description}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
