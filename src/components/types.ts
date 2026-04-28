import type { AssetFolder } from "@/lib/assets";

export interface AppRedirectProps {
  href: string;
}

export interface PortfolioPageProps {
  initialPath: string[];
  tree?: AssetFolder;
}
