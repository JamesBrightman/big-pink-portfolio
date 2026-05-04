"use client";
/* eslint-disable @next/next/no-img-element */
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import type { AssetFile } from "@/lib/assets";
import {
  attemptVideoAutoplay,
  collectFiles,
  formatAssetYear,
  subscribeToHydration,
} from "@/components/gallery/galleryUtils";
import type { AssetGalleryProps } from "@/components/gallery/types";
import { VirtualizedMasonryGrid } from "@/components/gallery/VirtualizedMasonryGrid";
import { SiteNav } from "@/components/nav/SiteNav";

export function AssetGallery({ tree, initialPath }: AssetGalleryProps) {
  const hasMounted = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
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
  const scrollGalleryToTop = () => {
    const masonryScroller = document.querySelector<HTMLElement>(
      ".masonry-scroll-shell",
    );

    masonryScroller?.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };
  const closeSelectedAsset = useCallback(() => {
    if (!selectedAsset) {
      return;
    }

    if (window.history.state?.assetLightbox === true) {
      window.history.back();

      return;
    }

    setSelectedAsset(null);
  }, [selectedAsset]);

  useEffect(() => {
    if (!selectedAsset) {
      return undefined;
    }

    if (window.history.state?.assetLightbox !== true) {
      window.history.pushState(
        { ...window.history.state, assetLightbox: true },
        "",
      );
    }

    const onPopState = () => {
      setSelectedAsset(null);
    };

    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, [selectedAsset]);

  useEffect(() => {
    if (!selectedAsset) {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeSelectedAsset();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [closeSelectedAsset, selectedAsset]);

  return (
    <section className="flex min-h-0 flex-1 flex-col px-4 pt-5">
      <SiteNav
        tree={tree}
        activePath={activePath}
        activePage={activePath.length === 0 ? "home" : undefined}
        onHomeClick={activePath.length === 0 ? scrollGalleryToTop : undefined}
      />

      {hasMounted ? (
        <VirtualizedMasonryGrid assets={assets} onOpen={setSelectedAsset} />
      ) : (
        <div className="min-h-[60vh]" />
      )}

      {selectedAsset ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-2 py-0 sm:p-4"
          onClick={closeSelectedAsset}
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
