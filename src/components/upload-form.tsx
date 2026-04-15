"use client";

import { useRef, useState, type FormEvent } from "react";

type UploadFormProps = {
  folderOptions: string[];
};

export function UploadForm({ folderOptions }: UploadFormProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as
        | { ok: true; folder: string; fileName: string }
        | { ok: false; error: string };

      if (!response.ok || !payload.ok) {
        setError("error" in payload ? payload.error : "Upload failed");
        return;
      }

      setStatus(`Added ${payload.fileName} to ${payload.folder}`);
      formRef.current?.reset();
    } catch {
      setError("Upload failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      ref={formRef}
      className="mt-6 grid gap-4"
      onSubmit={handleSubmit}
      encType="multipart/form-data"
    >
      <label className="grid gap-2 text-sm font-medium text-[#121826]">
        Folder
        <select
          name="folder"
          required
          className="rounded-md border border-[#d8e1ec] bg-white px-3 py-2 text-[#121826] outline-none transition focus:border-[#c8d4e2]"
          defaultValue={folderOptions[0] ?? ""}
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
        {isSubmitting ? "Adding..." : "Add"}
      </button>
    </form>
  );
}
