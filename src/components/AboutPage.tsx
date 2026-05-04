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
    imageSrc: "/assets-thumbs/traditional/21stapril2024.webp",
  },
  {
    title: "Digital art",
    href: "/digital/creative",
    imageSrc: "/assets-thumbs/digital/creative/Animated-Makeup.webp",
  },
  {
    title: "Physical creations",
    href: "/physical",
    imageSrc: "/assets-thumbs/physical/13thapril2025.webp",
  },
  {
    title: "Design",
    href: "/digital/design",
    imageSrc:
      "/assets-thumbs/digital/design/big-pink-pages-magazine-issue-3.webp",
  },
  {
    title: "Photography",
    href: "/digital/photo",
    imageSrc: "/assets-thumbs/digital/photo/other/10thmayy2024.webp",
  },
  {
    title: "Video",
    href: "/digital/video",
    imageSrc: "/assets-thumbs/digital/creative/12dec21.webp",
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
          <div className="overflow-hidden rounded-[1.7rem] border border-white/14 bg-white/8">
            <img
              src="/assets-thumbs/physical/13thapril2025.webp"
              alt="Big Pink Energy artwork preview"
              className="h-full min-h-[22rem] w-full object-cover"
            />
          </div>

          <div className="flex flex-col justify-center gap-5">
            <h1 className="max-w-[11ch] text-5xl font-semibold uppercase leading-[0.92] sm:text-6xl">
              Big pink energy
            </h1>
            <p className="max-w-2xl text-base leading-7 text-white/86 sm:text-lg">
              Big Pink Energy is a playful visual portfolio spanning traditional
              work, digital art, handmade physical pieces, editorial design,
              photography, and moving image. The work leans bold, tactile, and
              highly personal while staying open to commissions, collaborations,
              and creative direction projects.
            </p>
            <p className="max-w-2xl text-base leading-7 text-white/72 sm:text-lg">
              If you want to talk about a custom piece, a shoot, a campaign, or
              a one-off concept, use the contact form below.
            </p>
          </div>
        </div>

        <section className="rounded-[2rem] border border-white/14 bg-white/8 p-5 shadow-[0_20px_60px_rgba(91,0,56,0.18)] backdrop-blur-sm lg:p-7">
          <p className="text-sm uppercase tracking-[0.22em] text-white/72">
            Contact form
          </p>
          <h2 className="mt-3 text-3xl font-semibold uppercase">
            Start a conversation
          </h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-white/78">
            Share the kind of work you need, any timing, and the overall feel
            you want. The form opens your email app addressed to Big Pink
            Energy with your details filled in.
          </p>
          <div className="mt-6">
            <AboutContactForm />
          </div>
        </section>

        <section>
          <p className="text-sm uppercase tracking-[0.22em] text-white/72">
            Explore
          </p>
          <h2 className="mt-3 text-3xl font-semibold uppercase">
            Browse by medium
          </h2>

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
