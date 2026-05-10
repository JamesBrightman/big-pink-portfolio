"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackPageView } from "@/components/analytics/analytics";

export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) {
      return;
    }

    const query = window.location.search;
    const path = query ? `${pathname}${query}` : pathname;
    trackPageView(path);
  }, [pathname]);

  return null;
}
