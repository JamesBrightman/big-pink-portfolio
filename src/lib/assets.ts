import { cache } from "react";
import fs from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { z } from "zod";

export type AssetKind = "image" | "video";

export const ASSET_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const assetMetadataItemSchema = z.object({
  fileName: z.string().min(1),
  description: z.string().min(1),
  date: z.string().regex(ASSET_DATE_PATTERN, "Use YYYY-MM-DD"),
});

export const assetMetadataSchema = z.array(assetMetadataItemSchema);

export type AssetMetadataItem = {
  fileName: string;
  description: string;
  date: string;
};

export type AssetFile = {
  name: string;
  src: string;
  thumbnailSrc?: string;
  kind: AssetKind;
  description: string;
  date: string;
  width?: number;
  height?: number;
};

export type AssetFolder = {
  name: string;
  path: string[];
  folders: AssetFolder[];
  files: AssetFile[];
};

const ASSET_ROOT = path.join(process.cwd(), "public", "assets");
const THUMBNAIL_ROOT = path.join(process.cwd(), "public", "assets-thumbs");
const PUBLIC_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const ffprobePackageRoot = path.join(
  process.cwd(),
  "node_modules",
  "ffprobe-static",
);
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

type AssetDimensions = {
  width: number;
  height: number;
};

function toPublicSrc(filePath: string) {
  return filePath.split(path.sep).join("/");
}

function fileBaseName(fileName: string) {
  const dotIndex = fileName.lastIndexOf(".");

  return dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
}

function getAssetPublicSrc(relativeSegments: string[], fileName: string) {
  return `${PUBLIC_BASE_PATH}/${toPublicSrc(
    path.join("assets", ...relativeSegments, fileName),
  )}`;
}

function getThumbnailPublicSrc(relativeSegments: string[], fileName: string) {
  return `${PUBLIC_BASE_PATH}/${toPublicSrc(
    path.join(
      "assets-thumbs",
      ...relativeSegments,
      `${fileBaseName(fileName)}.webp`,
    ),
  )}`;
}

async function hasFile(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
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

async function readFileHeader(filePath: string, length: number) {
  const file = await fs.open(filePath, "r");

  try {
    const buffer = Buffer.alloc(length);
    const { bytesRead } = await file.read(buffer, 0, length, 0);

    return buffer.subarray(0, bytesRead);
  } finally {
    await file.close();
  }
}

function parseWebpDimensions(buffer: Buffer): AssetDimensions | null {
  if (
    buffer.length < 30 ||
    buffer.toString("ascii", 0, 4) !== "RIFF" ||
    buffer.toString("ascii", 8, 12) !== "WEBP"
  ) {
    return null;
  }

  const chunkType = buffer.toString("ascii", 12, 16);

  if (chunkType === "VP8X" && buffer.length >= 30) {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3),
    };
  }

  if (chunkType === "VP8L" && buffer.length >= 25) {
    const bits = buffer.readUInt32LE(21);

    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }

  if (chunkType === "VP8 " && buffer.length >= 30) {
    return {
      width: buffer.readUInt16LE(26),
      height: buffer.readUInt16LE(28),
    };
  }

  return null;
}

function parseGifDimensions(buffer: Buffer): AssetDimensions | null {
  if (
    buffer.length < 10 ||
    (buffer.toString("ascii", 0, 6) !== "GIF87a" &&
      buffer.toString("ascii", 0, 6) !== "GIF89a")
  ) {
    return null;
  }

  return {
    width: buffer.readUInt16LE(6),
    height: buffer.readUInt16LE(8),
  };
}

function parsePngDimensions(buffer: Buffer): AssetDimensions | null {
  if (
    buffer.length < 24 ||
    buffer.readUInt32BE(0) !== 0x89504e47 ||
    buffer.toString("ascii", 12, 16) !== "IHDR"
  ) {
    return null;
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function parseJpegDimensions(buffer: Buffer): AssetDimensions | null {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return null;
  }

  let offset = 2;

  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];

    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2;
      continue;
    }

    const segmentLength = buffer.readUInt16BE(offset + 2);

    if (segmentLength < 2 || offset + 2 + segmentLength > buffer.length) {
      return null;
    }

    const isStartOfFrame =
      marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);

    if (isStartOfFrame) {
      return {
        width: buffer.readUInt16BE(offset + 7),
        height: buffer.readUInt16BE(offset + 5),
      };
    }

    offset += 2 + segmentLength;
  }

  return null;
}

async function readImageDimensions(
  filePath: string,
): Promise<AssetDimensions | null> {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === ".webp") {
    const buffer = await readFileHeader(filePath, 64);

    return parseWebpDimensions(buffer);
  }

  if (extension === ".gif") {
    const buffer = await readFileHeader(filePath, 32);

    return parseGifDimensions(buffer);
  }

  if (extension === ".png") {
    const buffer = await readFileHeader(filePath, 32);

    return parsePngDimensions(buffer);
  }

  if (extension === ".jpg" || extension === ".jpeg") {
    const buffer = await readFileHeader(filePath, 4096);

    return parseJpegDimensions(buffer);
  }

  return null;
}

async function readVideoDimensions(
  filePath: string,
): Promise<AssetDimensions | null> {
  const ffprobePath = path.join(
    ffprobePackageRoot,
    "bin",
    process.platform,
    process.arch,
    process.platform === "win32" ? "ffprobe.exe" : "ffprobe",
  );

  if (!(await hasFile(ffprobePath))) {
    return null;
  }

  return new Promise((resolve, reject) => {
    const child = spawn(
      ffprobePath,
      [
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=width,height",
        "-of",
        "json",
        filePath,
      ],
      {
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
      },
    );

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`ffprobe exited with code ${code}: ${stderr}`));
        return;
      }

      try {
        const parsed = JSON.parse(stdout) as {
          streams?: Array<{ width?: number; height?: number }>;
        };
        const stream = parsed.streams?.[0];

        if (
          typeof stream?.width === "number" &&
          typeof stream?.height === "number" &&
          stream.width > 0 &&
          stream.height > 0
        ) {
          resolve({
            width: stream.width,
            height: stream.height,
          });
          return;
        }

        resolve(null);
      } catch (error) {
        reject(error);
      }
    });
  });
}

async function readFolder(
  folderPath: string,
  relativeSegments: string[],
): Promise<AssetFolder> {
  const entries = await fs.readdir(folderPath, { withFileTypes: true });
  const folders: AssetFolder[] = [];
  const files: AssetFile[] = [];
  const metadataMap = await readFolderMetadata(folderPath);

  for (const entry of entries) {
    const nextPath = path.join(folderPath, entry.name);

    if (entry.isDirectory()) {
      folders.push(
        await readFolder(nextPath, [...relativeSegments, entry.name]),
      );
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();
    const kind = getKind(extension);

    if (!kind) {
      continue;
    }

    if (
      kind === "image" &&
      extension !== ".webp" &&
      (await hasFile(path.join(folderPath, `${fileBaseName(entry.name)}.webp`)))
    ) {
      continue;
    }

    const metadata = metadataMap.get(entry.name);

    if (!metadata) {
      throw new Error(
        `Missing metadata for ${path.join(...relativeSegments, entry.name)}. Add it to ${path.join(...relativeSegments, "data.json")}.`,
      );
    }

    const thumbnailFilePath = path.join(
      THUMBNAIL_ROOT,
      ...relativeSegments,
      `${fileBaseName(entry.name)}.webp`,
    );
    const hasThumbnail = await hasFile(thumbnailFilePath);
    const displayedDimensions =
      kind === "video"
        ? await readVideoDimensions(nextPath)
        : hasThumbnail || kind === "image"
          ? await readImageDimensions(
              hasThumbnail ? thumbnailFilePath : nextPath,
            )
          : null;

    files.push({
      name: entry.name,
      src: getAssetPublicSrc(relativeSegments, entry.name),
      thumbnailSrc: hasThumbnail
        ? getThumbnailPublicSrc(relativeSegments, entry.name)
        : kind === "image"
          ? getAssetPublicSrc(relativeSegments, entry.name)
          : undefined,
      kind,
      ...metadata,
      ...(displayedDimensions ?? null),
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

async function getAssetTreeUncached() {
  return readFolder(ASSET_ROOT, []);
}

export const getAssetTree = cache(getAssetTreeUncached);

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

export function collectFolderPaths(
  root: AssetFolder,
  prefix: string[] = [],
): string[][] {
  return [
    prefix,
    ...root.folders.flatMap((folder) =>
      collectFolderPaths(folder, [...prefix, folder.name]),
    ),
  ];
}
