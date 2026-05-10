import Link from "next/link";
import { pushAnalyticsEvent } from "@/components/analytics/analytics";
import { FolderDropdownList } from "@/components/nav/FolderDropdownList";
import {
  folderPathHref,
  isPathActive,
  sortDropdownFolders,
} from "@/components/nav/navUtils";
import type { NavFolderItemProps } from "@/components/nav/types";

export function NavFolderItem({
  folder,
  pathSegments,
  activePath,
}: NavFolderItemProps) {
  const isActive = isPathActive(activePath, pathSegments);
  const hasChildren = folder.folders.length > 0;
  const target = folderPathHref(pathSegments);

  return (
    <div className="group/nav relative">
      <Link
        href={target}
        onClick={() =>
          pushAnalyticsEvent("nav_click", {
            nav_label: folder.name,
            nav_target: target,
            nav_location: "desktop_header",
            nav_depth: pathSegments.length,
          })
        }
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
