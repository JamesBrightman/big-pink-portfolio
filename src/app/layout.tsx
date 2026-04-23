import type { Metadata } from "next";
import "./globals.css";

const socialLinks = [
  {
    label: "TikTok",
    href: "#",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
        <path
          d="M14 3v11.25a4.75 4.75 0 1 1-4.75-4.75c.42 0 .83.06 1.21.16v2.86a2 2 0 1 0 1.04 1.75V3h2.5Zm0 0c.32 2.16 1.78 3.8 4 4.2v2.82a7.37 7.37 0 0 1-4-1.36V3Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "#",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
        <path
          d="M21.6 7.25a3.02 3.02 0 0 0-2.13-2.13C17.6 4.62 12 4.62 12 4.62s-5.6 0-7.47.5A3.02 3.02 0 0 0 2.4 7.25 31.65 31.65 0 0 0 1.9 12c0 1.62.17 3.22.5 4.75a3.02 3.02 0 0 0 2.13 2.13c1.87.5 7.47.5 7.47.5s5.6 0 7.47-.5a3.02 3.02 0 0 0 2.13-2.13c.33-1.53.5-3.13.5-4.75s-.17-3.22-.5-4.75ZM10 15.4V8.6l5.9 3.4L10 15.4Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "#",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
        <path
          d="M7.5 2.75h9A4.75 4.75 0 0 1 21.25 7.5v9a4.75 4.75 0 0 1-4.75 4.75h-9a4.75 4.75 0 0 1-4.75-4.75v-9A4.75 4.75 0 0 1 7.5 2.75Zm0 2A2.75 2.75 0 0 0 4.75 7.5v9a2.75 2.75 0 0 0 2.75 2.75h9a2.75 2.75 0 0 0 2.75-2.75v-9a2.75 2.75 0 0 0-2.75-2.75h-9ZM12 7.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Zm4.75-2.15a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
];

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
        <footer className="site-footer -mt-[30px] flex w-full flex-col items-center gap-2 bg-[#D848C8] px-4 py-3 text-sm font-medium tracking-[0.01em] text-white sm:grid sm:grid-cols-[1fr_auto_1fr] sm:px-8 sm:py-[20px]">
          <span className="text-center sm:col-start-2">bigpinkenergy@gmail.com</span>
          <div className="flex justify-center gap-4 sm:col-start-3 sm:justify-end sm:gap-3">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                aria-label={link.label}
                className="flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 sm:h-9 sm:w-9"
              >
                {link.icon}
              </a>
            ))}
          </div>
        </footer>
      </body>
    </html>
  );
}
