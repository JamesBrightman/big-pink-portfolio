import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const assetRoot = path.join(process.cwd(), "public", "assets");
const thumbnailRoot = path.join(process.cwd(), "public", "assets-thumbs");
const thumbnailWidth = 420;
const imageExtensions = new Set([
  ".avif",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".webp",
]);

function fileBaseName(fileName) {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
}

async function ensureDirectory(directoryPath) {
  await fs.mkdir(directoryPath, { recursive: true });
}

async function shouldGenerateThumbnail(sourcePath, outputPath) {
  try {
    const [sourceStats, outputStats] = await Promise.all([
      fs.stat(sourcePath),
      fs.stat(outputPath),
    ]);
    return outputStats.mtimeMs < sourceStats.mtimeMs;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return true;
    }

    throw error;
  }
}

async function generateThumbnail(sourcePath, outputPath) {
  const extension = path.extname(sourcePath).toLowerCase();

  await sharp(sourcePath, {
    animated: extension === ".gif" || extension === ".webp",
    limitInputPixels: false,
  })
    .rotate()
    .resize({
      width: thumbnailWidth,
      withoutEnlargement: true,
    })
    .webp({
      quality: 76,
      effort: 6,
    })
    .toFile(outputPath);
}

async function walkDirectory(currentDirectory) {
  const entries = await fs.readdir(currentDirectory, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(currentDirectory, entry.name);
    const relativePath = path.relative(assetRoot, sourcePath);

    if (entry.isDirectory()) {
      await walkDirectory(sourcePath);
      continue;
    }

    if (!imageExtensions.has(path.extname(entry.name).toLowerCase())) {
      continue;
    }

    const outputDirectory = path.join(
      thumbnailRoot,
      path.dirname(relativePath),
    );
    const outputPath = path.join(
      outputDirectory,
      `${fileBaseName(path.basename(relativePath))}.webp`,
    );

    if (!(await shouldGenerateThumbnail(sourcePath, outputPath))) {
      continue;
    }

    await ensureDirectory(outputDirectory);
    await generateThumbnail(sourcePath, outputPath);
    console.log(
      `[thumb] ${relativePath} -> ${path.relative(process.cwd(), outputPath)}`,
    );
  }
}

await ensureDirectory(thumbnailRoot);
await walkDirectory(assetRoot);
