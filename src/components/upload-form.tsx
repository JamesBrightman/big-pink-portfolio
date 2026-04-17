"use client";

import { useRef, useState, type FormEvent } from "react";

type UploadFormProps = {
  folderOptions: string[];
};

type DirectoryHandle = FileSystemDirectoryHandle;
type DirectoryPickerWindow = Window &
  typeof globalThis & {
    showDirectoryPicker?: (options?: {
      mode?: "read" | "readwrite";
    }) => Promise<DirectoryHandle>;
  };

function isDirectoryHandle(value: unknown): value is DirectoryHandle {
  return Boolean(value) && typeof value === "object";
}

async function getDirectoryHandle(
  root: DirectoryHandle,
  segments: string[],
  create = false,
): Promise<DirectoryHandle> {
  let current = root;

  for (const segment of segments) {
    current = await current.getDirectoryHandle(segment, { create });
  }

  return current;
}

async function readTextFile(
  directoryHandle: DirectoryHandle,
  fileName: string,
): Promise<string | null> {
  try {
    const fileHandle = await directoryHandle.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    return file.text();
  } catch {
    return null;
  }
}

async function writeFile(
  directoryHandle: DirectoryHandle,
  fileName: string,
  data: BlobPart,
): Promise<void> {
  const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(data);
  await writable.close();
}

async function fileExists(
  directoryHandle: DirectoryHandle,
  fileName: string,
): Promise<boolean> {
  try {
    await directoryHandle.getFileHandle(fileName);
    return true;
  } catch {
    return false;
  }
}

async function convertImageToWebp(file: File): Promise<Blob> {
  if (file.type === "image/webp") {
    return file;
  }

  const imageBitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = imageBitmap.width;
  canvas.height = imageBitmap.height;

  const context = canvas.getContext("2d");
  if (!context) {
    imageBitmap.close();
    throw new Error("Canvas is unavailable in this browser");
  }

  context.drawImage(imageBitmap, 0, 0);
  imageBitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", 0.9);
  });

  if (!blob) {
    throw new Error("Failed to convert the image to webp");
  }

  return blob;
}

function fileBaseName(fileName: string) {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
}

export function UploadForm({ folderOptions }: UploadFormProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [repoRootHandle, setRepoRootHandle] = useState<DirectoryHandle | null>(null);
  const [repoRootName, setRepoRootName] = useState<string>("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handlePickRepoRoot() {
    setError(null);
    setStatus(null);

    const pickerWindow = window as DirectoryPickerWindow;

    if (!pickerWindow.showDirectoryPicker) {
      setError("This browser does not support local repo access. Use Chrome or Edge.");
      return;
    }

    try {
      const handle = await pickerWindow.showDirectoryPicker({ mode: "readwrite" });
      if (!isDirectoryHandle(handle)) {
        throw new Error("Invalid directory selection");
      }

      await getDirectoryHandle(handle, ["public", "assets"]);
      setRepoRootHandle(handle);
      setRepoRootName(handle.name);
    } catch (selectionError) {
      if (selectionError instanceof DOMException && selectionError.name === "AbortError") {
        return;
      }

      setRepoRootHandle(null);
      setRepoRootName("");
      setError("Select the root folder of this repo so the uploader can update public/assets.");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus(null);

    if (!repoRootHandle) {
      setError("Pick the repo root folder first.");
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const folderValue = formData.get("folder");
    const dateValue = formData.get("date");
    const descriptionValue = formData.get("description");
    const fileValue = formData.get("file");

    if (
      typeof folderValue !== "string" ||
      typeof dateValue !== "string" ||
      typeof descriptionValue !== "string" ||
      !(fileValue instanceof File)
    ) {
      setError("Missing required fields.");
      return;
    }

    if (!folderValue.trim() || !dateValue.trim() || !descriptionValue.trim()) {
      setError("All fields are required.");
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue.trim())) {
      setError("Use YYYY-MM-DD for the date.");
      return;
    }

    if (!fileValue.type.startsWith("image/")) {
      setError("Only image uploads are supported.");
      return;
    }

    setIsSubmitting(true);

    try {
      const folderSegments = folderValue.split("/").filter(Boolean);
      const assetDirectory = await getDirectoryHandle(
        repoRootHandle,
        ["public", "assets", ...folderSegments],
      );
      const originalsDirectory = await getDirectoryHandle(repoRootHandle, ["originals"], true);

      const originalName = fileValue.name;
      const webpName = `${fileBaseName(originalName)}.webp`;

      if (await fileExists(assetDirectory, webpName)) {
        throw new Error("A webp with that name already exists in the selected folder.");
      }

      if (await fileExists(originalsDirectory, originalName)) {
        throw new Error("An original file with that name already exists in originals.");
      }

      const metadataRaw = (await readTextFile(assetDirectory, "data.json")) ?? "[]";
      const metadata = JSON.parse(metadataRaw) as Array<{
        fileName: string;
        description: string;
        date: string;
      }>;

      if (!Array.isArray(metadata)) {
        throw new Error("data.json must contain an array of asset entries.");
      }

      if (metadata.some((item) => item.fileName === webpName)) {
        throw new Error("Metadata already exists for that webp file.");
      }

      const webpBlob = await convertImageToWebp(fileValue);

      await writeFile(originalsDirectory, originalName, fileValue);
      await writeFile(assetDirectory, webpName, webpBlob);

      metadata.push({
        fileName: webpName,
        description: descriptionValue.trim(),
        date: dateValue.trim(),
      });

      await writeFile(assetDirectory, "data.json", `${JSON.stringify(metadata, null, 2)}\n`);

      setStatus(`Added ${webpName} to ${folderValue} and copied ${originalName} into originals.`);
      formRef.current?.reset();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Upload failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mt-6">
      <div className="rounded-2xl border border-[#d8e1ec] bg-white/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5b6270]">
          Repo access
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#5b6270]">
            {repoRootHandle ? `Connected to ${repoRootName}` : "Select the root folder of this repo."}
          </p>
          <button
            type="button"
            onClick={handlePickRepoRoot}
            className="rounded-full border border-[#d8e1ec] bg-white px-4 py-2 text-sm text-[#121826] transition hover:bg-[#f8fafc]"
          >
            {repoRootHandle ? "Change repo root" : "Choose repo root"}
          </button>
        </div>
      </div>

      <form ref={formRef} className="mt-6 grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-medium text-[#121826]">
          Folder
          <select
            name="folder"
            required
            defaultValue={folderOptions[0] ?? ""}
            className="rounded-md border border-[#d8e1ec] bg-white px-3 py-2 text-[#121826] outline-none transition focus:border-[#c8d4e2]"
          >
            {folderOptions.map((folder) => (
              <option key={folder} value={folder} className="bg-white text-[#121826]">
                {folder.replaceAll("/", " / ")}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium text-[#121826]">
          Image
          <input
            ref={fileInputRef}
            name="file"
            type="file"
            accept="image/*"
            required
            className="rounded-md border border-[#d8e1ec] bg-white px-3 py-2 text-[#121826] file:mr-4 file:rounded-full file:border-0 file:bg-[#f326a8] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[#e01d99]"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-[#121826]">
            Date
            <input
              name="date"
              type="date"
              required
              className="rounded-md border border-[#d8e1ec] bg-white px-3 py-2 text-[#121826] outline-none transition focus:border-[#c8d4e2]"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-[#121826]">
            Description
            <input
              name="description"
              type="text"
              required
              placeholder="Short description"
              className="rounded-md border border-[#d8e1ec] bg-white px-3 py-2 text-[#121826] outline-none transition placeholder:text-[#7a7f88] focus:border-[#c8d4e2]"
            />
          </label>
        </div>

        {error ? (
          <div className="rounded-md border border-[#fecdd3] bg-[#fff1f2] px-4 py-3 text-sm text-[#9f1239]">
            {error}
          </div>
        ) : null}

        {status ? (
          <div className="rounded-md border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#166534]">
            {status}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 w-fit rounded-full bg-[#f326a8] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#e01d99] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Adding..." : "Add locally"}
        </button>
      </form>
    </div>
  );
}
