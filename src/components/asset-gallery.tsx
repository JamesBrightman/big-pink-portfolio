"use client";

/* eslint-disable @next/next/no-img-element */
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { AssetFile, AssetFolder } from "@/lib/assets";

const PAGE_SIZE = 24;

function collectFiles(folder: AssetFolder): AssetFile[] {
  const childFiles = folder.folders.flatMap(collectFiles);

  return [...folder.files, ...childFiles].sort(
    (a, b) => Date.parse(b.date) - Date.parse(a.date),
  );
}

function formatAssetYear(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

type MediaShellProps = {
  children: ReactNode;
  loaded: boolean;
  aspectRatio?: string;
};

function MediaShell({ children, loaded, aspectRatio }: MediaShellProps) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-[18px] border border-white/55 bg-[#dfe3ea] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      <div
        className={`absolute inset-0 overflow-hidden rounded-[18px] transition-opacity duration-300 ${
          loaded ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
        aria-hidden={loaded}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#e5e8ee_0%,#d9dee6_100%)]" />
        <div className="absolute inset-[10px] rounded-[14px] bg-[rgba(255,255,255,0.14)]" />
        <div className="absolute inset-y-0 -left-1/2 w-1/2 bg-[linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.16)_45%,rgba(255,255,255,0.45)_50%,rgba(255,255,255,0.16)_55%,rgba(255,255,255,0)_100%)] animate-[loading-shimmer_2.2s_ease-in-out_infinite]" />
      </div>
      <div
        className={`transition-opacity duration-300 ${aspectRatio ? "absolute inset-0" : ""} ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

type MediaTileProps = {
  asset: AssetFile;
  onOpen: (asset: AssetFile) => void;
  priority: boolean;
};

function MediaTile({ asset, onOpen, priority }: MediaTileProps) {
  const [loaded, setLoaded] = useState(false);
  const aspectRatio =
    asset.kind === "image" && asset.width && asset.height ? `${asset.width} / ${asset.height}` : "4 / 5";

  return (
    <button
      type="button"
      onClick={() => onOpen(asset)}
      className="group relative block w-full overflow-hidden rounded-[18px] bg-white text-left shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
      style={{
        contentVisibility: "auto",
        containIntrinsicSize: "18rem 28rem",
      }}
    >
      <MediaShell loaded={loaded} aspectRatio={asset.kind === "image" ? aspectRatio : undefined}>
        {asset.kind === "image" ? (
          <img
            src={asset.src}
            alt={asset.name}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={priority ? "high" : "low"}
            onLoad={() => setLoaded(true)}
            className="block h-full w-full object-cover"
          />
        ) : (
          <video
            src={asset.src}
            controls
            preload="metadata"
            onLoadedData={() => setLoaded(true)}
            className="block h-full w-full object-cover"
          />
        )}
      </MediaShell>

      <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition duration-200 group-hover:opacity-100">
        <div className="max-w-[80%] text-center text-white">
          <p className="text-sm font-semibold tracking-tight">{formatAssetYear(asset.date)}</p>
          <p className="mt-1 text-sm leading-5 text-white/90">{asset.description}</p>
        </div>
      </div>
    </button>
  );
}

type ModalMediaProps = {
  asset: AssetFile;
};

function ModalMedia({ asset }: ModalMediaProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <MediaShell loaded={loaded}>
      {asset.kind === "image" ? (
        <img
          src={asset.src}
          alt={asset.name}
          onLoad={() => setLoaded(true)}
          className="block max-h-[92vh] max-w-[96vw] h-auto w-auto object-contain"
        />
      ) : (
        <video
          src={asset.src}
          controls
          autoPlay
          onLoadedData={() => setLoaded(true)}
          className="block max-h-[92vh] max-w-[96vw] h-auto w-auto object-contain"
        />
      )}
    </MediaShell>
  );
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
  const [selectedAsset, setSelectedAsset] = useState<AssetFile | null>(null);
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

  useEffect(() => {
    if (!selectedAsset) {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedAsset(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [selectedAsset]);

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
        <ResponsiveMasonry
          columnsCountBreakPoints={{
            0: 1,
            640: 2,
            1024: 4,
            1280: 6,
          }}
        >
          <Masonry gutter="16px">
            {visibleCards.map((asset, index) => (
              <MediaTile
                key={`${asset.src}-${asset.name}`}
                asset={asset}
                onOpen={setSelectedAsset}
                priority={index < 8}
              />
            ))}
          </Masonry>
        </ResponsiveMasonry>
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

      {selectedAsset ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={selectedAsset.name}
          onClick={() => setSelectedAsset(null)}
        >
          <div
            className="flex max-h-[92vh] max-w-[96vw] items-center justify-center"
            onClick={(event) => event.stopPropagation()}
          >
            <ModalMedia key={selectedAsset.src} asset={selectedAsset} />
          </div>
        </div>
      ) : null}
    </section>
  );
}
