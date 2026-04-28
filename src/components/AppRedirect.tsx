"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { AppRedirectProps } from "@/components/types";

export function AppRedirect({ href }: AppRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    router.replace(href);
  }, [href, router]);

  return null;
}
