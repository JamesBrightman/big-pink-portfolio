"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { pushAnalyticsEvent } from "@/components/analytics/analytics";
import type { AssetFolder } from "@/lib/assets";
import { HomeIcon } from "@/components/icons/HomeIcon";
import { MobileNav } from "@/components/nav/MobileNav";
import { NavFolderItem } from "@/components/nav/NavFolderItem";

type SiteNavProps = {
  tree: AssetFolder;
  activePath: string[];
  activePage?: "about" | "home";
  onHomeClick?: () => void;
};

export function SiteNav({
  tree,
  activePath,
  activePage,
  onHomeClick,
}: SiteNavProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const homeIsActive = activePage === "home";
  const aboutIsActive = activePage === "about";
  const showHomeButton = homeIsActive && typeof onHomeClick === "function";

  const trackNavClick = (navLabel: string, navTarget: string) => {
    pushAnalyticsEvent("nav_click", {
      nav_label: navLabel,
      nav_target: navTarget,
      nav_location: "desktop_header",
    });
  };

  useEffect(() => {
    if (!isMobileNavOpen) {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileNavOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isMobileNavOpen]);

  return (
    <header className="relative z-50 mb-1 bg-transparent">
      <div className="overflow-hidden lg:overflow-visible">
        <nav className="flex items-center justify-between bg-transparent px-0 pb-2">
          {showHomeButton ? (
            <button
              type="button"
              aria-label="Scroll to top"
              onClick={() => {
                trackNavClick("home", "/");
                onHomeClick();
              }}
              className="relative flex items-center justify-center pb-3 text-white italic transition hover:text-white"
            >
              <HomeIcon />
            </button>
          ) : (
            <Link
              href="/"
              aria-label="Home"
              onClick={() => trackNavClick("home", "/")}
              className={`relative flex items-center justify-center pb-3 transition hover:text-white ${
                homeIsActive ? "text-white" : "text-white/85"
              }`}
            >
              <HomeIcon />
            </Link>
          )}

          <div className="hidden flex-wrap items-center justify-end gap-8 lg:flex">
            {tree.folders.map((folder) => (
              <NavFolderItem
                key={folder.name}
                folder={folder}
                pathSegments={[folder.name]}
                activePath={activePath}
              />
            ))}

            <Link
              href="/about"
              onClick={() => trackNavClick("about", "/about")}
              className={`block whitespace-nowrap pb-3 text-2xl font-medium uppercase tracking-[0.01em] transition sm:text-3xl ${
                aboutIsActive
                  ? "italic text-white"
                  : "text-white/85 hover:text-white"
              }`}
            >
              about
            </Link>
          </div>

          <MobileNav
            tree={tree}
            activePath={activePath}
            activePage={activePage}
            isOpen={isMobileNavOpen}
            onOpen={() => setIsMobileNavOpen(true)}
            onClose={() => setIsMobileNavOpen(false)}
          />
        </nav>
      </div>
    </header>
  );
}
