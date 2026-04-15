"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AssetFile, AssetFolder } from "@/lib/assets";

const PAGE_SIZE = 24;
const MASONRY_COLUMN_GAP_PX = 16;
const MASONRY_MIN_COLUMN_WIDTH_REM = 16;

function collectFiles(folder: AssetFolder): AssetFile[] {
  const childFiles = folder.folders.flatMap(collectFiles);

  return [...folder.files, ...childFiles].sort(
    (a, b) => Date.parse(b.date) - Date.parse(a.date),
  );
}

function pickAspectRatio(src: string) {
  const ratios = ["4 / 5", "3 / 4", "1 / 1", "5 / 4", "16 / 9"];
  const hash = Array.from(src).reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return ratios[hash % ratios.length];
}

function formatAssetDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function HomeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-8 w-8">
      <path
        d="M4 11.5L12 5l8 6.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M6.5 10.5V20h11V10.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function folderPathHref(pathSegments: string[]) {
  return `/${pathSegments.join("/")}`;
}

function isPathActive(activePath: string[], pathSegments: string[]) {
  return activePath.slice(0, pathSegments.length).join("/") === pathSegments.join("/");
}

function sortDropdownFolders(folders: AssetFolder[]) {
  return [...folders].sort((a, b) => {
    if (a.name === "other" && b.name !== "other") {
      return 1;
    }

    if (b.name === "other" && a.name !== "other") {
      return -1;
    }

    return a.name.localeCompare(b.name);
  });
}

function getMaxColumnsForViewport(width: number) {
  if (width >= 1280) {
    return 6;
  }

  if (width >= 1024) {
    return 4;
  }

  if (width >= 768) {
    return 2;
  }

  return 1;
}

type NavFolderItemProps = {
  folder: AssetFolder;
  pathSegments: string[];
  activePath: string[];
};

type FolderDropdownListProps = {
  folder: AssetFolder;
  pathSegments: string[];
  activePath: string[];
  depth?: number;
};

function FolderDropdownList({
  folder,
  pathSegments,
  activePath,
  depth = 0,
}: FolderDropdownListProps) {
  const isActive = isPathActive(activePath, pathSegments);
  const hasChildren = folder.folders.length > 0;
  const indentClass = depth === 0 ? "pl-0" : "pl-4";

  return (
    <div className={indentClass}>
      <Link
        href={folderPathHref(pathSegments)}
        className={`block whitespace-nowrap px-3 py-2 text-sm font-medium uppercase tracking-[0.01em] transition text-left ${
          isActive ? "italic text-white" : "text-white/80 hover:text-white"
        } ${depth > 0 ? "pl-6" : ""}`}
      >
        {folder.name}
      </Link>

      {hasChildren && (
        <div className="flex flex-col">
          {sortDropdownFolders(folder.folders).map((child) => (
            <FolderDropdownList
              key={child.name}
              folder={child}
              pathSegments={[...pathSegments, child.name]}
              activePath={activePath}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NavFolderItem({ folder, pathSegments, activePath }: NavFolderItemProps) {
  const isActive = isPathActive(activePath, pathSegments);
  const hasChildren = folder.folders.length > 0;

  return (
    <div className="group/nav relative pb-3">
      <Link
        href={folderPathHref(pathSegments)}
        className={`block whitespace-nowrap pb-3 text-2xl font-medium uppercase tracking-[0.01em] transition sm:text-3xl ${
          isActive ? "italic text-white" : "text-white/85 hover:text-white"
        }`}
      >
        {folder.name}
      </Link>

      {hasChildren && (
        <div className="pointer-events-none absolute left-0 top-full z-40 opacity-0 transition duration-150 group-hover/nav:pointer-events-auto group-hover/nav:opacity-100 group-focus-within/nav:pointer-events-auto group-focus-within/nav:opacity-100">
          <div className="min-w-60 rounded-md border border-white/10 bg-[#ee57b7] p-2 shadow-[0_24px_70px_rgba(0,0,0,0.38)]">
            <div className="flex flex-col py-1">
              {sortDropdownFolders(folder.folders).map((child) => (
                <FolderDropdownList
                  key={child.name}
                  folder={child}
                  pathSegments={[...pathSegments, child.name]}
                  activePath={activePath}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type AssetGalleryProps = {
  tree: AssetFolder;
  initialPath: string[];
};

export function AssetGallery({ tree, initialPath }: AssetGalleryProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [maxColumns, setMaxColumns] = useState(6);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const activePath = initialPath;
  const activeFolder = useMemo(() => {
    let current = tree;

    for (const segment of activePath) {
      const next = current.folders.find((folder) => folder.name === segment);

      if (!next) {
        return tree;
      }

      current = next;
    }

    return current;
  }, [activePath, tree]);

  const cards = useMemo(() => collectFiles(activeFolder), [activeFolder]);

  const visibleCards = cards.slice(0, visibleCount);
  const canLoadMore = visibleCount < cards.length;
  const usedColumns = Math.max(1, Math.min(maxColumns, visibleCards.length || 1));
  const shouldCenter = visibleCards.length > 0 && visibleCards.length < maxColumns;
  const masonryWidth = shouldCenter
    ? `calc(${usedColumns} * ${MASONRY_MIN_COLUMN_WIDTH_REM}rem + ${(usedColumns - 1) * MASONRY_COLUMN_GAP_PX}px)`
    : "100%";

  useEffect(() => {
    const updateColumns = () => {
      setMaxColumns(getMaxColumnsForViewport(window.innerWidth));
    };

    updateColumns();
    window.addEventListener("resize", updateColumns);

    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || !canLoadMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((current) => Math.min(current + PAGE_SIZE, cards.length));
        }
      },
      {
        rootMargin: "400px",
      },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [canLoadMore, cards.length]);

  return (
    <section className="flex min-h-screen w-full flex-col px-4 py-5">
      <header className="mb-4 bg-transparent">
        <nav className="flex items-center justify-between px-0 py-4">
          <Link
            href="/"
            aria-label="Home"
            className={`relative flex items-center justify-center pb-3 transition ${
              activePath.length === 0 ? "text-white italic" : "text-white/85 hover:text-white"
            }`}
          >
            <HomeIcon />
          </Link>

          <div className="flex flex-wrap items-center justify-end gap-8">
            {tree.folders.map((folder) => (
              <NavFolderItem
                key={folder.name}
                folder={folder}
                pathSegments={[folder.name]}
                activePath={activePath}
              />
            ))}
          </div>
        </nav>
      </header>

      {visibleCards.length > 0 ? (
        <div className="flex w-full justify-center">
          <div
            className="w-full"
            style={{
              columnCount: shouldCenter ? usedColumns : maxColumns,
              columnGap: `${MASONRY_COLUMN_GAP_PX}px`,
              width: masonryWidth,
            }}
          >
            {visibleCards.map((asset) => (
              <article
                key={`${asset.src}-${asset.name}`}
                className="group mb-4 break-inside-avoid overflow-hidden rounded-md bg-white shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
              >
                <div
                  className="relative w-full overflow-hidden rounded-md border-[3px] border-white bg-[#f3f6fb]"
                  style={{ aspectRatio: pickAspectRatio(asset.src) }}
                >
                  {asset.kind === "image" ? (
                    <Image
                      src={asset.src}
                      alt={asset.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <video
                      src={asset.src}
                      controls
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />
                  )}

                  <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition duration-200 group-hover:opacity-100">
                    <div className="max-w-[80%] text-center text-white">
                      <p className="text-sm font-semibold tracking-tight">
                        {formatAssetDate(asset.date)}
                      </p>
                      <p className="mt-1 text-sm leading-5 text-white/90">{asset.description}</p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-[1.75rem] border border-dashed border-[#d8e1ec] bg-white p-10 text-center">
          <p className="text-lg font-medium text-[#121826]">No media in this folder yet.</p>
          <p className="mt-2 text-sm leading-6 text-[#5c6675]">
            Add images or videos to <span className="font-medium text-[#2f6bed]">public/assets</span> and
            they will appear here automatically.
          </p>
        </div>
      )}

      <div ref={sentinelRef} className="h-4" />

      {canLoadMore && (
        <div className="flex justify-center pb-6">
          <button
            type="button"
            onClick={() => setVisibleCount((current) => Math.min(current + PAGE_SIZE, cards.length))}
            className="rounded-full border border-[#d8e1ec] bg-white px-5 py-2.5 text-sm font-medium text-[#121826] shadow-sm transition hover:border-[#c8d4e2] hover:bg-[#f8fafc]"
          >
            Load more
          </button>
        </div>
      )}
    </section>
  );
}
