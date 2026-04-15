import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

export type AssetKind = "image" | "video";

export const ASSET_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const assetMetadataItemSchema = z.object({
  fileName: z.string().min(1),
  description: z.string().min(1),
  date: z.string().regex(ASSET_DATE_PATTERN, "Use YYYY-MM-DD"),
});

const assetMetadataSchema = z.array(assetMetadataItemSchema);

export type AssetMetadataItem = {
  fileName: string;
  description: string;
  date: string;
};

export type AssetFile = {
  name: string;
  src: string;
  kind: AssetKind;
  description: string;
  date: string;
};

export type AssetFolder = {
  name: string;
  path: string[];
  folders: AssetFolder[];
  files: AssetFile[];
};

const ASSET_ROOT = path.join(process.cwd(), "public", "assets");
const MEDIA_EXTENSIONS = new Set([
  ".avif",
  ".gif",
  ".jpeg",
  ".jpg",
  ".mov",
  ".mp4",
  ".png",
  ".webm",
  ".webp",
]);

function toPublicSrc(filePath: string) {
  return filePath.split(path.sep).join("/");
}

function getKind(extension: string): AssetKind | null {
  if ([".mp4", ".mov", ".webm"].includes(extension)) {
    return "video";
  }

  if (MEDIA_EXTENSIONS.has(extension)) {
    return "image";
  }

  return null;
}

async function readFolderMetadata(folderPath: string) {
  const metadataPath = path.join(folderPath, "data.json");

  try {
    const rawMetadata = await fs.readFile(metadataPath, "utf8");
    const parsedMetadata = assetMetadataSchema.parse(JSON.parse(rawMetadata));

    return new Map(
      parsedMetadata.map((item) => [
        item.fileName,
        {
          fileName: item.fileName,
          description: item.description,
          date: item.date,
        },
      ]),
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return new Map<string, AssetMetadataItem>();
    }

    throw error;
  }
}

async function readFolder(folderPath: string, relativeSegments: string[]): Promise<AssetFolder> {
  const entries = await fs.readdir(folderPath, { withFileTypes: true });
  const folders: AssetFolder[] = [];
  const files: AssetFile[] = [];
  const metadataMap = await readFolderMetadata(folderPath);

  for (const entry of entries) {
    const nextPath = path.join(folderPath, entry.name);

    if (entry.isDirectory()) {
      folders.push(await readFolder(nextPath, [...relativeSegments, entry.name]));
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();
    const kind = getKind(extension);

    if (!kind) {
      continue;
    }

    const metadata = metadataMap.get(entry.name);

    if (!metadata) {
      throw new Error(
        `Missing metadata for ${path.join(...relativeSegments, entry.name)}. Add it to ${path.join(...relativeSegments, "data.json")}.`,
      );
    }

    files.push({
      name: entry.name,
      src: `/${toPublicSrc(path.join("assets", ...relativeSegments, entry.name))}`,
      kind,
      ...metadata,
    });
  }

  folders.sort((a, b) => a.name.localeCompare(b.name));
  files.sort((a, b) => b.date.localeCompare(a.date));

  return {
    name: relativeSegments.at(-1) ?? "assets",
    path: relativeSegments,
    folders,
    files,
  };
}

export async function getAssetTree() {
  return readFolder(ASSET_ROOT, []);
}

export function findFolderByPath(root: AssetFolder, pathSegments: string[]) {
  let current: AssetFolder = root;

  for (const segment of pathSegments) {
    const next = current.folders.find((folder) => folder.name === segment);

    if (!next) {
      return null;
    }

    current = next;
  }

  return current;
}

function collectFilesFromFolder(folder: AssetFolder): AssetFile[] {
  const childFiles = folder.folders.flatMap(collectFilesFromFolder);

  return [...folder.files, ...childFiles].sort(
    (a, b) => Date.parse(b.date) - Date.parse(a.date),
  );
}

export function getAssetsForPath(root: AssetFolder, pathSegments: string[]) {
  const folder = findFolderByPath(root, pathSegments) ?? root;

  return collectFilesFromFolder(folder);
}

export function collectFolderPaths(root: AssetFolder, prefix: string[] = []): string[][] {
  return [
    prefix,
    ...root.folders.flatMap((folder) => collectFolderPaths(folder, [...prefix, folder.name])),
  ];
}
