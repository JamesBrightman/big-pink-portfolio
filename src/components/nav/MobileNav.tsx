import Link from "next/link";
import type { AssetFolder } from "@/lib/assets";
import { CloseIcon } from "@/components/icons/CloseIcon";
import { MenuIcon } from "@/components/icons/MenuIcon";
import { FolderDropdownList } from "@/components/nav/FolderDropdownList";
import {
  folderPathHref,
  isPathActive,
  sortDropdownFolders,
} from "@/components/nav/navUtils";

type MobileNavProps = {
  tree: AssetFolder;
  activePath: string[];
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export function MobileNav({
  tree,
  activePath,
  isOpen,
  onOpen,
  onClose,
}: MobileNavProps) {
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
