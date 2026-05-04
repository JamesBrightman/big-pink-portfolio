/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { AssetFolder } from "@/lib/assets";
import { AboutContactForm } from "@/components/AboutContactForm";
import { GalleryFooter } from "@/components/gallery/GalleryFooter";
import { SiteNav } from "@/components/nav/SiteNav";

const categoryCards = [
  {
    title: "Traditional art",
    href: "/traditional",
    imageSrc: "/about-assets/traditional-art-thumbnail.webp",
  },
  {
    title: "Digital art",
    href: "/digital/creative",
    imageSrc: "/about-assets/digital-art-thumbnail.webp",
  },
  {
    title: "Physical creations",
    href: "/physical",
    imageSrc: "/about-assets/physical-creations-thumbnail.webp",
  },
  {
    title: "Design",
    href: "/digital/design",
    imageSrc: "/about-assets/design-thumbnail.webp",
  },
  {
    title: "photo",
    href: "/digital/photo",
    imageSrc: "/about-assets/photography-thumbnail.webp",
  },
  {
    title: "Video",
    href: "/digital/video",
    imageSrc: "/about-assets/video-thumbnail.webp",
  },
];

type AboutPageProps = {
  tree: AssetFolder;
};

export function AboutPage({ tree }: AboutPageProps) {
  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-10 pt-5 text-white">
      <SiteNav tree={tree} activePath={[]} activePage="about" />

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 pt-4 lg:gap-10">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="mx-auto w-full max-w-[34rem] overflow-hidden lg:mx-0">
            <img
              src="/about-assets/bpe-about.webp"
              alt="Big Pink Energy portrait"
              className="h-full min-h-[18rem] w-full object-cover"
            />
          </div>

          <div className="flex flex-col items-center justify-center gap-5 text-center lg:items-start lg:text-left">
            <h1 className="whitespace-nowrap text-4xl font-semibold uppercase leading-[0.92] sm:text-5xl xl:text-6xl">
              Big pink energy
            </h1>
            <p className="max-w-2xl text-base leading-7 text-white/86 sm:text-lg">
              Hi! I&apos;m Brooke, known online as big pink energy. I&apos;m a
              DIY creative - it all started when I taught myself how to make my
              own clothes and use photoshop as a teenager, and I&apos;ve been
              learning and absorbing inspiration ever since.
            </p>
            <p className="max-w-2xl text-base leading-7 text-white/72 sm:text-lg">
              Whether it&apos;s physical pieces, animated designs or traditional
              artwork, I just love to create. This portfolio spans the majority
              of my work, both personal and professional. I&apos;m always open
              to collaborate and work on something fun, so if you&apos;d like to
              make your next project a little more pink, feel free to get in
              touch.
            </p>
          </div>
        </div>

        <section className="rounded-[2rem] border border-white/14 bg-white/8 p-5 shadow-[0_20px_60px_rgba(91,0,56,0.18)] backdrop-blur-sm lg:p-7">
          <h2 className="text-3xl font-semibold uppercase">Let&apos;s chat</h2>
          <div className="mt-6">
            <AboutContactForm />
          </div>
        </section>

        <section>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {categoryCards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="group overflow-hidden rounded-[1.55rem] border border-white/14 bg-[#f674c7]/40 transition duration-200 hover:-translate-y-1 hover:bg-[#ff91d7]/45"
              >
                <div className="aspect-[5/4] overflow-hidden">
                  <img
                    src={card.imageSrc}
                    alt={card.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="px-4 py-4">
                  <span className="text-lg font-semibold uppercase leading-tight">
                    {card.title}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </section>

      <div className="mx-auto mt-10 w-full max-w-7xl">
        <GalleryFooter />
      </div>
    </main>
  );
}
