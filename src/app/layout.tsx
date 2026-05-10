import type { Metadata } from "next";
import { GoogleTagManager } from "@/components/analytics/GoogleTagManager";
import "./globals.css";

export const metadata: Metadata = {
  title: "Big Pink Portfolio",
  description: "Creative portfolio for bigpinkenergy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full min-h-dvh antialiased"
      suppressHydrationWarning
    >
      <body
        className="flex h-dvh min-h-dvh overflow-hidden flex-col bg-[#FFA4FA] text-[#121826]"
        suppressHydrationWarning
      >
        <GoogleTagManager />
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
