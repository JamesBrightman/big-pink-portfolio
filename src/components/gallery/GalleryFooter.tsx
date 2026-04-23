import { InstagramIcon } from "@/components/icons/InstagramIcon";
import { TikTokIcon } from "@/components/icons/TikTokIcon";
import { YouTubeIcon } from "@/components/icons/YouTubeIcon";
import { socialLinks } from "@/components/gallery/galleryConstants";

export function GalleryFooter() {
  return (
    <footer className="flex min-h-20 w-full flex-col items-center justify-center gap-1 bg-[rgb(225,80,172)] px-4 py-2 text-sm font-medium tracking-[0.01em] text-white sm:grid sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-2 sm:px-6 sm:py-2">
      <a
        href="mailto:bigpinkenergy@gmail.com"
        className="text-center hover:underline sm:col-start-1 sm:self-center sm:justify-self-start sm:text-left sm:text-base"
      >
        bigpinkenergy@gmail.com
      </a>
      <div className="flex justify-center gap-4 sm:col-start-3 sm:self-center sm:justify-end sm:gap-2">
        <a
          href={socialLinks.tikTok}
          aria-label="TikTok"
          target="_blank"
          rel="noreferrer noopener"
          className="flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 sm:h-11 sm:w-11"
        >
          <TikTokIcon />
        </a>
        <a
          href={socialLinks.youTube}
          aria-label="YouTube"
          target="_blank"
          rel="noreferrer noopener"
          className="flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 sm:h-11 sm:w-11"
        >
          <YouTubeIcon />
        </a>
        <a
          href={socialLinks.instagram}
          aria-label="Instagram"
          target="_blank"
          rel="noreferrer noopener"
          className="flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 sm:h-11 sm:w-11"
        >
          <InstagramIcon />
        </a>
      </div>
    </footer>
  );
}
