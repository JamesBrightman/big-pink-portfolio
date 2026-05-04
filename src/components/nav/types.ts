import type { AssetFolder } from "@/lib/assets";

export interface FolderDropdownListProps {
  folder: AssetFolder;
  pathSegments: string[];
  activePath: string[];
  depth?: number;
  onNavigate?: () => void;
}

export interface MobileNavProps {
  tree: AssetFolder;
  activePath: string[];
  activePage?: "about" | "home";
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export interface NavFolderItemProps {
  folder: AssetFolder;
  pathSegments: string[];
  activePath: string[];
}
