import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Big Pink Portfolio",
  description: "A portfolio gallery with folder-driven, Pinterest-style media walls.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#FFA4FA] text-[#121826]">
        {children}
      </body>
    </html>
  );
}
