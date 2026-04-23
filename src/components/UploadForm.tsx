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
type ImageBitmapWithOrientationOptions = ImageBitmapOptions & {
  imageOrientation?: "from-image" | "flipY" | "none";
};
const localUploadHelperUrl =
  process.env.NEXT_PUBLIC_LOCAL_UPLOAD_HELPER_URL ?? "";
const THUMBNAIL_MAX_WIDTH = 420;

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
  const fileHandle = await directoryHandle.getFileHandle(fileName, {
    create: true,
  });
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

async function convertImageToWebp(
  file: File,
  options?: {
    maxWidth?: number;
  },
): Promise<Blob> {
  if (file.type === "image/webp" && !options?.maxWidth) {
    return file;
  }

  let imageBitmap: ImageBitmap;

  try {
    imageBitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    } as ImageBitmapWithOrientationOptions);
  } catch {
    imageBitmap = await createImageBitmap(file);
  }

  const canvas = document.createElement("canvas");
  const maxWidth = options?.maxWidth;
  const targetWidth =
    maxWidth && imageBitmap.width > maxWidth ? maxWidth : imageBitmap.width;
  const targetHeight = Math.round(
    imageBitmap.height * (targetWidth / imageBitmap.width),
  );

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    imageBitmap.close();
    throw new Error("Canvas is unavailable in this browser");
  }

  context.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);
  imageBitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", maxWidth ? 0.76 : 0.9);
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

function getTargetAsset(file: File) {
  if (file.type === "image/webp") {
    return {
      fileName: `${fileBaseName(file.name)}.webp`,
      data: file as BlobPart,
      outputLabel: "webp",
    };
  }

  return {
    fileName: `${fileBaseName(file.name)}.webp`,
    data: null as BlobPart | null,
    outputLabel: isGif(file) ? "animated webp" : "webp",
  };
}

function isGif(file: File) {
  return file.type === "image/gif" || file.name.toLowerCase().endsWith(".gif");
}

async function convertWithLocalHelper(
  file: File,
  options?: {
    maxWidth?: number;
  },
): Promise<Blob> {
  if (!localUploadHelperUrl) {
    throw new Error("Local upload helper is unavailable.");
  }

  const formData = new FormData();
  formData.append("file", file);
  if (options?.maxWidth) {
    formData.append("maxWidth", String(options.maxWidth));
  }

  const response = await fetch(`${localUploadHelperUrl}/convert`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let message = "Local conversion failed.";

    try {
      const payload = (await response.json()) as { error?: string };
      if (payload.error) {
        message = payload.error;
      }
    } catch {}

    throw new Error(message);
  }

  return response.blob();
}

async function buildUploadAsset(
  file: File,
  options?: {
    maxWidth?: number;
  },
): Promise<BlobPart> {
  if (file.type === "image/webp") {
    if (!options?.maxWidth) {
      return file;
    }
  }

  if (localUploadHelperUrl) {
    try {
      return await convertWithLocalHelper(file, options);
    } catch (error) {
      if (isGif(file)) {
        throw error;
      }
    }
  }

  if (isGif(file)) {
    throw new Error(
      "Animated GIF conversion requires the local upload helper. Use npm run dev or npm run start.",
    );
  }

  return convertImageToWebp(file, options);
}

export function UploadForm({ folderOptions }: UploadFormProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [repoRootHandle, setRepoRootHandle] = useState<DirectoryHandle | null>(
    null,
  );
  const [repoRootName, setRepoRootName] = useState<string>("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handlePickRepoRoot() {
    setError(null);
    setStatus(null);

    const pickerWindow = window as DirectoryPickerWindow;

    if (!pickerWindow.showDirectoryPicker) {
      setError(
        "This browser does not support local repo access. Use Chrome or Edge.",
      );
      return;
    }

    try {
      const handle = await pickerWindow.showDirectoryPicker({
        mode: "readwrite",
      });
      if (!isDirectoryHandle(handle)) {
        throw new Error("Invalid directory selection");
      }

      await getDirectoryHandle(handle, ["public", "assets"]);
      setRepoRootHandle(handle);
      setRepoRootName(handle.name);
    } catch (selectionError) {
      if (
        selectionError instanceof DOMException &&
        selectionError.name === "AbortError"
      ) {
        return;
      }

      setRepoRootHandle(null);
      setRepoRootName("");
      setError(
        "Select the root folder of this repo so the uploader can update public/assets.",
      );
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
      const assetDirectory = await getDirectoryHandle(repoRootHandle, [
        "public",
        "assets",
        ...folderSegments,
      ]);
      const thumbnailDirectory = await getDirectoryHandle(
        repoRootHandle,
        ["public", "assets-thumbs", ...folderSegments],
        true,
      );
      const originalsDirectory = await getDirectoryHandle(
        repoRootHandle,
        ["originals"],
        true,
      );

      const originalName = fileValue.name;
      const targetAsset = getTargetAsset(fileValue);
      const outputName = targetAsset.fileName;

      if (await fileExists(assetDirectory, outputName)) {
        throw new Error(
          `An asset with that name already exists in the selected folder.`,
        );
      }

      if (await fileExists(originalsDirectory, originalName)) {
        throw new Error(
          "An original file with that name already exists in originals.",
        );
      }

      const metadataRaw =
        (await readTextFile(assetDirectory, "data.json")) ?? "[]";
      const metadata = JSON.parse(metadataRaw) as Array<{
        fileName: string;
        description: string;
        date: string;
      }>;

      if (!Array.isArray(metadata)) {
        throw new Error("data.json must contain an array of asset entries.");
      }

      if (metadata.some((item) => item.fileName === outputName)) {
        throw new Error("Metadata already exists for that asset file.");
      }

      const outputData =
        targetAsset.data ?? (await buildUploadAsset(fileValue));
      const thumbnailData = await buildUploadAsset(fileValue, {
        maxWidth: THUMBNAIL_MAX_WIDTH,
      });

      await writeFile(originalsDirectory, originalName, fileValue);
      await writeFile(assetDirectory, outputName, outputData);
      await writeFile(thumbnailDirectory, outputName, thumbnailData);

      metadata.push({
        fileName: outputName,
        description: descriptionValue.trim(),
        date: dateValue.trim(),
      });

      await writeFile(
        assetDirectory,
        "data.json",
        `${JSON.stringify(metadata, null, 2)}\n`,
      );

      setStatus(
        `Added ${outputName} to ${folderValue} as ${targetAsset.outputLabel}, wrote a ${THUMBNAIL_MAX_WIDTH}px thumbnail, and copied ${originalName} into originals.`,
      );
      formRef.current?.reset();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Upload failed.",
      );
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
            {repoRootHandle
              ? `Connected to ${repoRootName}`
              : "Select the root folder of this repo."}
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
              <option
                key={folder}
                value={folder}
                className="bg-white text-[#121826]"
              >
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
