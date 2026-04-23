"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type AppRedirectProps = {
  href: string;
};

export function AppRedirect({ href }: AppRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    router.replace(href);
  }, [href, router]);

  return null;
}
