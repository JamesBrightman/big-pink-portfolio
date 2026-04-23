"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import {
  type SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  AutoSizer,
  CellMeasurer,
  CellMeasurerCache,
  Masonry,
  createMasonryCellPositioner,
  type MasonryCellProps,
  type Positioner,
} from "react-virtualized";
import type { AssetFile, AssetFolder } from "@/lib/assets";

const MASONRY_GUTTER = 16;
const MASONRY_OVERSCAN_PX = 320;
const MASONRY_EDGE_PADDING = 16;

type FooterPositionerParams = {
  cellMeasurerCache: CellMeasurerCache;
  columnCount: number;
  columnWidth: number;
  footerIndex: number;
  spacer: number;
};

const socialLinks = [
  {
    label: "TikTok",
    href: "https://www.tiktok.com/discover/bigpinkenergy",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
        <path
          d="M14 3v11.25a4.75 4.75 0 1 1-4.75-4.75c.42 0 .83.06 1.21.16v2.86a2 2 0 1 0 1.04 1.75V3h2.5Zm0 0c.32 2.16 1.78 3.8 4 4.2v2.82a7.37 7.37 0 0 1-4-1.36V3Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@bigpinkenergy",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
        <path
          d="M21.6 7.25a3.02 3.02 0 0 0-2.13-2.13C17.6 4.62 12 4.62 12 4.62s-5.6 0-7.47.5A3.02 3.02 0 0 0 2.4 7.25 31.65 31.65 0 0 0 1.9 12c0 1.62.17 3.22.5 4.75a3.02 3.02 0 0 0 2.13 2.13c1.87.5 7.47.5 7.47.5s5.6 0 7.47-.5a3.02 3.02 0 0 0 2.13-2.13c.33-1.53.5-3.13.5-4.75s-.17-3.22-.5-4.75ZM10 15.4V8.6l5.9 3.4L10 15.4Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/bigpinkenergy/",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
        <path
          d="M7.5 2.75h9A4.75 4.75 0 0 1 21.25 7.5v9a4.75 4.75 0 0 1-4.75 4.75h-9a4.75 4.75 0 0 1-4.75-4.75v-9A4.75 4.75 0 0 1 7.5 2.75Zm0 2A2.75 2.75 0 0 0 4.75 7.5v9a2.75 2.75 0 0 0 2.75 2.75h9a2.75 2.75 0 0 0 2.75-2.75v-9a2.75 2.75 0 0 0-2.75-2.75h-9ZM12 7.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Zm4.75-2.15a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
];

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

function subscribeToHydration() {
  return () => {};
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
  return (
    activePath.slice(0, pathSegments.length).join("/") ===
    pathSegments.join("/")
  );
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

function getColumnWidth(width: number, columnCount: number) {
  return Math.max(
    140,
    Math.floor((width - MASONRY_GUTTER * (columnCount - 1)) / columnCount),
  );
}

function getColumnCount(width: number) {
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

function getAssetHeight(asset: AssetFile, columnWidth: number) {
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

function getAssetKey(asset: AssetFile, index: number) {
  return `${asset.src}::${index}`;
}

function getFooterTop({
  cellMeasurerCache,
  columnCount,
  footerIndex,
  spacer,
}: Pick<
  FooterPositionerParams,
  "cellMeasurerCache" | "columnCount" | "footerIndex" | "spacer"
>) {
  const columnHeights = Array.from({ length: columnCount }, () => 0);

  for (let index = 0; index < footerIndex; index += 1) {
    let shortestColumnIndex = 0;

    for (
      let columnIndex = 1;
      columnIndex < columnHeights.length;
      columnIndex += 1
    ) {
      if (columnHeights[columnIndex] < columnHeights[shortestColumnIndex]) {
        shortestColumnIndex = columnIndex;
      }
    }

    columnHeights[shortestColumnIndex] +=
      cellMeasurerCache.getHeight(index, 0) + spacer;
  }

  return Math.max(...columnHeights);
}

function createFooterPositioner({
  cellMeasurerCache,
  columnCount,
  columnWidth,
  footerIndex,
  spacer,
}: FooterPositionerParams): Positioner {
  const imagePositioner = createMasonryCellPositioner({
    cellMeasurerCache,
    columnCount,
    columnWidth,
    spacer,
  });

  const positioner = ((index: number) => {
    if (index !== footerIndex) {
      return imagePositioner(index);
    }

    return {
      left: 0,
      top: getFooterTop({
        cellMeasurerCache,
        columnCount,
        footerIndex,
        spacer,
      }),
    };
  }) as Positioner;

  positioner.reset = (params) => {
    imagePositioner.reset(params);
  };

  return positioner;
}

function attemptVideoAutoplay(video: HTMLVideoElement | null) {
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
  onNavigate?: () => void;
};

function FolderDropdownList({
  folder,
  pathSegments,
  activePath,
  depth = 0,
  onNavigate,
}: FolderDropdownListProps) {
  const isActive = isPathActive(activePath, pathSegments);
  const hasChildren = folder.folders.length > 0;
  const indentClass = depth === 0 ? "pl-0" : "pl-4";

  return (
    <div className={indentClass}>
      <Link
        href={folderPathHref(pathSegments)}
        onClick={onNavigate}
        className={`block whitespace-nowrap px-3 py-2 text-left text-sm font-medium uppercase tracking-[0.01em] transition ${
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
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NavFolderItem({
  folder,
  pathSegments,
  activePath,
}: NavFolderItemProps) {
  const isActive = isPathActive(activePath, pathSegments);
  const hasChildren = folder.folders.length > 0;

  return (
    <div className="group/nav relative">
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

function MenuIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7">
      <path
        d="M6 6l12 12M18 6L6 18"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function MobileNav({
  tree,
  activePath,
  isOpen,
  onOpen,
  onClose,
}: {
  tree: AssetFolder;
  activePath: string[];
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <button
        type="button"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
        onClick={isOpen ? onClose : onOpen}
        className="relative z-50 rounded-full border border-white/35 bg-white/12 p-2 text-white backdrop-blur-sm transition hover:bg-white/18 lg:hidden"
      >
        {isOpen ? <CloseIcon /> : <MenuIcon />}
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/45 lg:hidden"
          onClick={onClose}
        >
          <div
            className="absolute right-0 top-0 flex h-full w-[min(86vw,24rem)] flex-col overflow-y-auto border-l border-white/15 bg-[#ec5fb9] px-5 pb-8 pt-24 text-white shadow-[-24px_0_60px_rgba(0,0,0,0.28)]"
            onClick={(event) => event.stopPropagation()}
          >
            <Link
              href="/"
              onClick={onClose}
              className={`mb-4 block border-b border-white/20 pb-4 text-2xl font-medium uppercase tracking-[0.01em] ${
                activePath.length === 0 ? "italic text-white" : "text-white/90"
              }`}
            >
              home
            </Link>

            <div className="flex flex-col gap-2">
              {tree.folders.map((folder) => (
                <div
                  key={folder.name}
                  className="border-b border-white/12 pb-2 last:border-b-0"
                >
                  <Link
                    href={folderPathHref([folder.name])}
                    onClick={onClose}
                    className={`block py-2 text-2xl font-medium uppercase tracking-[0.01em] ${
                      isPathActive(activePath, [folder.name])
                        ? "italic text-white"
                        : "text-white/90"
                    }`}
                  >
                    {folder.name}
                  </Link>

                  {folder.folders.length > 0 ? (
                    <div className="pb-2">
                      {sortDropdownFolders(folder.folders).map((child) => (
                        <FolderDropdownList
                          key={child.name}
                          folder={child}
                          pathSegments={[folder.name, child.name]}
                          activePath={activePath}
                          onNavigate={onClose}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function MasonryMediaCard({
  asset,
  onOpen,
}: {
  asset: AssetFile;
  onOpen: (asset: AssetFile) => void;
}) {
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

function GalleryFooter() {
  return (
    <footer className="flex min-h-24 w-full flex-col items-center justify-center gap-2 bg-[#D848C8] px-4 py-3 text-sm font-medium tracking-[0.01em] text-white sm:grid sm:grid-cols-[1fr_auto_1fr] sm:px-8">
      <span className="text-center sm:col-start-2">
        bigpinkenergy@gmail.com
      </span>
      <div className="flex justify-center gap-4 sm:col-start-3 sm:justify-end sm:gap-3">
        {socialLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            aria-label={link.label}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 sm:h-9 sm:w-9"
          >
            {link.icon}
          </a>
        ))}
      </div>
    </footer>
  );
}

function VirtualizedMasonryContent({
  assets,
  height,
  onOpen,
  width,
}: {
  assets: AssetFile[];
  height: number;
  onOpen: (asset: AssetFile) => void;
  width: number;
}) {
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

function VirtualizedMasonryGrid({
  assets,
  onOpen,
}: {
  assets: AssetFile[];
  onOpen: (asset: AssetFile) => void;
}) {
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
        <VirtualizedMasonryGrid assets={assets} onOpen={setSelectedAsset} />
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
