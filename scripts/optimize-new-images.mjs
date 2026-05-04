import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const cwd = process.cwd();
const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");

function getOptionValue(optionName, fallback) {
  const option = process.argv.find((arg) => arg.startsWith(`${optionName}=`));
  if (!option) {
    return fallback;
  }

  return option.slice(option.indexOf("=") + 1);
}

const assetRoot = path.resolve(
  cwd,
  getOptionValue("--asset-root", path.join("public", "assets")),
);
const originalRoot = path.resolve(
  cwd,
  getOptionValue("--original-root", "originals"),
);
const thumbnailRoot = path.resolve(
  cwd,
  getOptionValue("--thumbnail-root", path.join("public", "assets-thumbs")),
);

const thumbnailWidth = 420;
const thumbnailQuality = 76;
const fullAssetQuality = 76;
const convertibleExtensions = new Set([".jpeg", ".jpg", ".png"]);

function fileBaseName(fileName) {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
}

async function ensureDirectory(directoryPath) {
  if (dryRun) {
    return;
  }

  await fs.mkdir(directoryPath, { recursive: true });
}

async function hasFile(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readFolderMetadata(folderPath) {
  const metadataPath = path.join(folderPath, "data.json");
  try {
    const raw = await fs.readFile(metadataPath, "utf8");
    return {
      metadataPath,
      items: JSON.parse(raw),
    };
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return {
        metadataPath,
        items: null,
      };
    }

    throw error;
  }
}

async function writeFolderMetadata(metadataPath, items) {
  if (dryRun) {
    return;
  }

  await fs.writeFile(metadataPath, `${JSON.stringify(items, null, 2)}\n`);
}

async function generateWebp(sourcePath, outputPath, width) {
  const extension = path.extname(sourcePath).toLowerCase();
  let pipeline = sharp(sourcePath, {
    animated: extension === ".gif" || extension === ".webp",
    limitInputPixels: false,
  }).rotate();

  if (typeof width === "number") {
    pipeline = pipeline.resize({
      width,
      withoutEnlargement: true,
    });
  }

  await pipeline
    .webp({
      quality: width ? thumbnailQuality : fullAssetQuality,
      effort: 6,
    })
    .toFile(outputPath);
}

async function moveToOriginals(sourcePath, outputPath) {
  if (dryRun) {
    return;
  }

  await fs.rm(outputPath, { force: true });

  try {
    await fs.rename(sourcePath, outputPath);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "EXDEV"
    ) {
      await fs.copyFile(sourcePath, outputPath);
      await fs.unlink(sourcePath);
      return;
    }

    throw error;
  }
}

async function optimizeFolder(folderPath, relativeSegments, summary) {
  const entries = await fs.readdir(folderPath, { withFileTypes: true });
  const { metadataPath, items } = await readFolderMetadata(folderPath);
  let metadataChanged = false;

  for (const entry of entries) {
    const sourcePath = path.join(folderPath, entry.name);

    if (entry.isDirectory()) {
      await optimizeFolder(
        sourcePath,
        [...relativeSegments, entry.name],
        summary,
      );
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();

    if (!convertibleExtensions.has(extension)) {
      continue;
    }

    const sourceBaseName = fileBaseName(entry.name);
    const optimizedFileName = `${sourceBaseName}.webp`;
    const optimizedAssetPath = path.join(folderPath, optimizedFileName);
    const thumbnailDirectory = path.join(thumbnailRoot, ...relativeSegments);
    const thumbnailPath = path.join(thumbnailDirectory, optimizedFileName);
    const originalDirectory = path.join(originalRoot, ...relativeSegments);
    const originalAssetPath = path.join(originalDirectory, entry.name);

    if (!items) {
      throw new Error(
        `Missing ${metadataPath} for ${path.join(...relativeSegments, entry.name)}`,
      );
    }

    const metadataIndex = items.findIndex(
      (item) =>
        item.fileName === entry.name || item.fileName === optimizedFileName,
    );

    if (metadataIndex === -1) {
      throw new Error(
        `Missing metadata entry for ${path.join(...relativeSegments, entry.name)} in ${metadataPath}`,
      );
    }

    const hasOptimizedAsset = await hasFile(optimizedAssetPath);
    const hasThumbnailAsset = await hasFile(thumbnailPath);
    const needsMetadataUpdate =
      items[metadataIndex].fileName !== optimizedFileName;
    const needsArchive = true;

    if (
      !hasOptimizedAsset &&
      !hasThumbnailAsset &&
      !needsMetadataUpdate &&
      !needsArchive
    ) {
      continue;
    }

    await ensureDirectory(thumbnailDirectory);
    await ensureDirectory(originalDirectory);

    if (!dryRun) {
      if (!hasOptimizedAsset) {
        await generateWebp(sourcePath, optimizedAssetPath);
      }

      if (!hasThumbnailAsset) {
        await generateWebp(sourcePath, thumbnailPath, thumbnailWidth);
      }
    }

    if (needsMetadataUpdate) {
      items[metadataIndex] = {
        ...items[metadataIndex],
        fileName: optimizedFileName,
      };
      metadataChanged = true;
      summary.updatedMetadata += 1;
    }

    await moveToOriginals(sourcePath, originalAssetPath);

    if (!hasOptimizedAsset) {
      summary.converted += 1;
    }

    if (!hasThumbnailAsset) {
      summary.generatedThumbnails += 1;
    }

    summary.archivedOriginals += 1;
    summary.actions.push({
      source: path.join(...relativeSegments, entry.name),
      optimized: path.join(...relativeSegments, optimizedFileName),
      thumbnail: path.join(...relativeSegments, optimizedFileName),
      archivedOriginal: path.join(...relativeSegments, entry.name),
    });
  }

  if (metadataChanged) {
    await writeFolderMetadata(metadataPath, items);
  }
}

async function main() {
  const summary = {
    assetRoot,
    originalRoot,
    thumbnailRoot,
    dryRun,
    converted: 0,
    generatedThumbnails: 0,
    updatedMetadata: 0,
    archivedOriginals: 0,
    actions: [],
  };

  await ensureDirectory(thumbnailRoot);
  await ensureDirectory(originalRoot);
  await optimizeFolder(assetRoot, [], summary);

  if (summary.actions.length > 0) {
    console.log("Files queued for conversion:");
    for (const action of summary.actions) {
      console.log(`- ${action.source}`);
    }
    console.log("");
  } else {
    console.log("Files queued for conversion:");
    console.log("- none");
    console.log("");
  }

  console.log(JSON.stringify(summary, null, 2));
}

await main();
