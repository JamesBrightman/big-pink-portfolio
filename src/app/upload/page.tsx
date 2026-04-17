import Link from "next/link";

export default async function UploadPage() {
  return (
    <main className="min-h-screen px-4 py-5 text-[#121826]">
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/30 bg-white/92 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-md">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-[#5b6270]">Static hosting</p>
            <h1 className="mt-2 text-3xl font-medium">Asset changes are build-time only</h1>
          </div>

          <Link
            href="/"
            className="rounded-full border border-[#d8e1ec] px-4 py-2 text-sm text-[#121826] transition hover:bg-[#f8fafc]"
          >
            Back to gallery
          </Link>
        </div>

        <div className="space-y-4 text-sm leading-6 text-[#5b6270]">
          <p>
            This site now builds as a static export for GitHub Pages. That means the in-browser upload
            form and server upload endpoint are no longer available.
          </p>

          <p>
            To add or update media, edit the files under <span className="font-medium">public/assets</span>,
            update the matching <span className="font-medium">data.json</span>, then rebuild the site.
          </p>

          <p>
            Use <span className="font-medium">npm run build:pages</span> to produce the exact static output
            that GitHub Pages serves.
          </p>
        </div>
      </div>
    </main>
  );
}
