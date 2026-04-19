"use client";

/* eslint-disable @next/next/no-img-element */
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import Link from "next/link";
import {
  useEffect,
  useState,
  useSyncExternalStore,
  type SyntheticEvent,
} from "react";
import type { AssetFile, AssetFolder } from "@/lib/assets";

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

type AssetGalleryProps = {
  tree: AssetFolder;
  initialPath: string[];
};

function setVideoControls(
  event: SyntheticEvent<HTMLVideoElement>,
  isVisible: boolean,
) {
  event.currentTarget.controls = isVisible;
}

function MediaCard({
  asset,
  onOpen,
}: {
  asset: AssetFile;
  onOpen: (asset: AssetFile) => void;
}) {
  return (
    <div className="group relative overflow-hidden rounded-[18px] border border-white/55 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
      {asset.kind === "image" ? (
        <button
          type="button"
          onClick={() => onOpen(asset)}
          className="block w-full"
        >
          <img
            src={asset.thumbnailSrc ?? asset.src}
            alt={asset.name}
            loading="lazy"
            decoding="async"
            className="block h-auto w-full"
          />
        </button>
      ) : (
        <video
          src={asset.src}
          autoPlay
          loop
          muted
          onBlur={(event) => setVideoControls(event, false)}
          onFocus={(event) => setVideoControls(event, true)}
          onMouseEnter={(event) => setVideoControls(event, true)}
          onMouseLeave={(event) => setVideoControls(event, false)}
          playsInline
          preload="metadata"
          className="block h-auto w-full"
        />
      )}

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition duration-200 group-hover:opacity-100">
        <div className="max-w-[80%] text-center text-white">
          <p className="text-sm font-semibold tracking-tight">
            {new Intl.DateTimeFormat("en-GB", {
              year: "numeric",
              timeZone: "UTC",
            }).format(new Date(`${asset.date}T00:00:00Z`))}
          </p>
          <p className="mt-1 text-sm leading-5 text-white/90">
            {asset.description}
          </p>
        </div>
      </div>
    </div>
  );
}

export function AssetGallery({ tree, initialPath }: AssetGalleryProps) {
  const hasMounted = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetFile | null>(null);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [hasScrolledDown, setHasScrolledDown] = useState(false);
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

  const cards = collectFiles(activeFolder);

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

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const onScroll = () => {
      const nextScrollY = window.scrollY;
      const isNearTop = nextScrollY < 24;

      setHasScrolledDown(!isNearTop);

      if (isNearTop) {
        setIsHeaderVisible(true);
      } else if (nextScrollY < lastScrollY) {
        setIsHeaderVisible(true);
      } else if (nextScrollY > lastScrollY) {
        setIsHeaderVisible(false);
      }

      lastScrollY = nextScrollY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <section className="flex min-h-screen w-full flex-col px-4 py-5">
      <header
        className={`sticky z-30 mb-4 bg-transparent transition-[top,opacity] duration-300 ${
          isHeaderVisible || isMobileNavOpen
            ? "top-0 opacity-100"
            : "-top-24 opacity-0"
        }`}
      >
        <nav
          className={`flex items-center justify-between px-0 py-4 transition-colors duration-300 ${
            hasScrolledDown ? "bg-[#ffa4fa]" : "bg-transparent"
          }`}
        >
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
      </header>

      {cards.length > 0 ? (
        hasMounted ? (
          <ResponsiveMasonry
            columnsCountBreakPoints={{
              0: 2,
              640: 2,
              1024: 4,
              1280: 6,
            }}
          >
            <Masonry gutter="16px">
              {cards.map((asset) => (
                <MediaCard
                  key={`${asset.src}-${asset.name}`}
                  asset={asset}
                  onOpen={setSelectedAsset}
                />
              ))}
            </Masonry>
          </ResponsiveMasonry>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            {cards.map((asset) => (
              <MediaCard
                key={`${asset.src}-${asset.name}`}
                asset={asset}
                onOpen={setSelectedAsset}
              />
            ))}
          </div>
        )
      ) : (
        <div className="rounded-[1.75rem] border border-dashed border-[#d8e1ec] bg-white p-10 text-center">
          <p className="text-lg font-medium text-[#121826]">
            No media in this folder yet.
          </p>
          <p className="mt-2 text-sm leading-6 text-[#5c6675]">
            Add images or videos to{" "}
            <span className="font-medium text-[#2f6bed]">public/assets</span>{" "}
            and they will appear here automatically.
          </p>
        </div>
      )}

      {selectedAsset ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setSelectedAsset(null)}
        >
          <div
            className="flex max-h-[95vh] max-w-[95vw] flex-col items-center"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={selectedAsset.src}
              alt={selectedAsset.name}
              decoding="async"
              className="max-h-[82vh] max-w-[95vw] rounded-[18px] object-contain"
            />

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
