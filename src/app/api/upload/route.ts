import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import {
  ASSET_DATE_PATTERN,
  assetMetadataSchema,
  collectFolderPaths,
  getAssetTree,
} from "@/lib/assets";

const ASSET_ROOT = path.join(process.cwd(), "public", "assets");
export const runtime = "nodejs";

async function readMetadata(metadataPath: string) {
  const raw = await fs.readFile(metadataPath, "utf8").catch((error) => {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return "[]";
    }

    throw error;
  });

  const parsed = assetMetadataSchema.parse(JSON.parse(raw));

  return [...parsed];
}

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const folderValue = formData.get("folder");
    const dateValue = formData.get("date");
    const descriptionValue = formData.get("description");
    const file = formData.get("file");

    if (
      typeof folderValue !== "string" ||
      typeof dateValue !== "string" ||
      typeof descriptionValue !== "string" ||
      !(file instanceof File)
    ) {
      return errorResponse("Missing required fields");
    }

    const folder = folderValue.trim();
    const date = dateValue.trim();
    const description = descriptionValue.trim();

    if (!ASSET_DATE_PATTERN.test(date)) {
      return errorResponse("Use YYYY-MM-DD for the date");
    }

    if (!file.type.startsWith("image/")) {
      return errorResponse("Only image uploads are supported");
    }

    const tree = await getAssetTree();
    const validFolders = new Set(
      collectFolderPaths(tree)
        .filter((segments) => segments.length > 0)
        .map((segments) => segments.join("/")),
    );

    if (!validFolders.has(folder)) {
      return errorResponse("Invalid folder selection");
    }

    const folderPath = path.resolve(ASSET_ROOT, folder);
    if (!folderPath.startsWith(ASSET_ROOT)) {
      return errorResponse("Invalid folder path");
    }

    const folderStat = await fs.stat(folderPath).catch(() => null);
    if (!folderStat?.isDirectory()) {
      return errorResponse("Folder does not exist");
    }

    const fileName = path.basename(file.name);
    if (!fileName) {
      return errorResponse("Invalid file name");
    }

    const targetPath = path.join(folderPath, fileName);
    const metadataPath = path.join(folderPath, "data.json");

    await fs.access(targetPath).then(
      () => {
        throw new Error("File already exists in that folder");
      },
      () => null,
    );

    const metadata = await readMetadata(metadataPath);
    if (metadata.some((item) => item.fileName === fileName)) {
      return errorResponse("Metadata already exists for that file");
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(targetPath, bytes);

    metadata.push({
      fileName,
      description,
      date,
    });

    metadata.sort((a, b) => {
      if (a.date === b.date) {
        return a.fileName.localeCompare(b.fileName);
      }

      return b.date.localeCompare(a.date);
    });

    await fs.writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");

    return NextResponse.json({ ok: true, folder, fileName });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return errorResponse(message);
  }
}
