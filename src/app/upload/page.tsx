import Link from "next/link";
import { UploadForm } from "@/components/upload-form";
import { collectFolderPaths, getAssetTree } from "@/lib/assets";

export default async function UploadPage() {
  const tree = await getAssetTree();
  const folderOptions = collectFolderPaths(tree)
    .filter((segments) => segments.length > 0)
    .map((segments) => segments.join("/"));

  return (
    <main className="min-h-screen px-4 py-5 text-[#121826]">
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/30 bg-white/92 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-md">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-[#5b6270]">Local upload</p>
            <h1 className="mt-2 text-3xl font-medium">Add a new asset</h1>
          </div>

          <Link
            href="/"
            className="rounded-full border border-[#d8e1ec] px-4 py-2 text-sm text-[#121826] transition hover:bg-[#f8fafc]"
          >
            Back to gallery
          </Link>
        </div>

        <p className="max-w-2xl text-sm leading-6 text-[#5b6270]">
          Add one image at a time. The filename is inferred automatically from the uploaded file. The
          image will be copied into the selected folder under <span className="font-medium">public/assets</span>
          and that folder&apos;s <span className="font-medium">data.json</span> will be updated for you.
        </p>

        <UploadForm folderOptions={folderOptions} />
      </div>
    </main>
  );
}
