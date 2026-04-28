import type { AssetFolder } from "@/lib/assets";

export function folderPathHref(pathSegments: string[]) {
  return `/${pathSegments.join("/")}`;
}

export function isPathActive(activePath: string[], pathSegments: string[]) {
  return (
    activePath.slice(0, pathSegments.length).join("/") ===
    pathSegments.join("/")
  );
}

export function sortDropdownFolders(folders: AssetFolder[]) {
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
