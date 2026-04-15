import fs from "node:fs/promises";
import path from "node:path";

const ASSET_ROOT = path.join(process.cwd(), "public", "assets");
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function usage() {
  console.error(
    "Usage: bash scripts/add-asset.sh <folder> <source-file> <YYYY-MM-DD> <description>",
  );
}

function toPosixPath(filePath) {
  return filePath.split(path.sep).join("/");
}

async function main() {
  const [folderArg, sourceArg, dateArg, ...descriptionParts] = process.argv.slice(2);

  if (!folderArg || !sourceArg || !dateArg || descriptionParts.length === 0) {
    usage();
    process.exitCode = 1;
    return;
  }

  if (!DATE_PATTERN.test(dateArg)) {
    throw new Error(`Invalid date "${dateArg}". Use YYYY-MM-DD.`);
  }

  const description = descriptionParts.join(" ");
  const folderPath = path.resolve(ASSET_ROOT, folderArg);
  const sourcePath = path.resolve(sourceArg);

  if (!folderPath.startsWith(ASSET_ROOT)) {
    throw new Error(`Folder must be inside ${toPosixPath(ASSET_ROOT)}.`);
  }

  const folderStat = await fs.stat(folderPath).catch(() => null);
  if (!folderStat?.isDirectory()) {
    throw new Error(`Folder does not exist: ${toPosixPath(folderPath)}`);
  }

  const sourceStat = await fs.stat(sourcePath).catch(() => null);
  if (!sourceStat?.isFile()) {
    throw new Error(`Source file does not exist: ${toPosixPath(sourcePath)}`);
  }

  const fileName = path.basename(sourcePath);
  const targetPath = path.join(folderPath, fileName);
  const metadataPath = path.join(folderPath, "data.json");

  await fs.access(targetPath).then(
    () => {
      throw new Error(`Target file already exists: ${toPosixPath(targetPath)}`);
    },
    () => null,
  );

  const rawMetadata = await fs.readFile(metadataPath, "utf8").catch((error) => {
    if (error?.code === "ENOENT") {
      return "[]";
    }

    throw error;
  });

  const metadata = JSON.parse(rawMetadata);
  if (!Array.isArray(metadata)) {
    throw new Error(`Invalid data.json in ${toPosixPath(folderPath)}. Expected a JSON array.`);
  }

  if (metadata.some((item) => item?.fileName === fileName)) {
    throw new Error(`Metadata already exists for ${fileName} in ${toPosixPath(metadataPath)}.`);
  }

  await fs.copyFile(sourcePath, targetPath);

  metadata.push({
    fileName,
    description,
    date: dateArg,
  });

  metadata.sort((a, b) => {
    if (a.date === b.date) {
      return a.fileName.localeCompare(b.fileName);
    }

    return b.date.localeCompare(a.date);
  });

  await fs.writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");

  console.log(`Added ${fileName} to ${toPosixPath(folderPath)}`);
  console.log(`Updated ${toPosixPath(metadataPath)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
