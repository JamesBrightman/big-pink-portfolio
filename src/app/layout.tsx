import type { Metadata } from "next";
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
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body
        className="flex h-screen overflow-hidden flex-col bg-[#FFA4FA] text-[#121826]"
        suppressHydrationWarning
      >
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        <footer className="px-4 py-4 text-center text-sm font-medium tracking-[0.01em] text-white">
          bigpinkenergy@gmail.com
        </footer>
      </body>
    </html>
  );
}
