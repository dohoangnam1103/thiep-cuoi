import { createHash } from "node:crypto";
import { linkSync, readdirSync, readFileSync, renameSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";

const root = join(process.cwd(), "public", "chungdoi");
const apply = process.argv.includes("--apply");

function collectFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return collectFiles(path);
    return entry.isFile() ? [path] : [];
  });
}

const filesBySize = new Map();
for (const path of collectFiles(root)) {
  const size = statSync(path).size;
  const paths = filesBySize.get(size) ?? [];
  paths.push(path);
  filesBySize.set(size, paths);
}

const filesByHash = new Map();
for (const paths of filesBySize.values()) {
  if (paths.length < 2) continue;
  for (const path of paths) {
    const hash = createHash("sha256").update(readFileSync(path)).digest("hex");
    const matches = filesByHash.get(hash) ?? [];
    matches.push(path);
    filesByHash.set(hash, matches);
  }
}

let duplicateFiles = 0;
let duplicateBytes = 0;
let linkedFiles = 0;

for (const matches of filesByHash.values()) {
  if (matches.length < 2) continue;
  matches.sort();
  const [canonical, ...duplicates] = matches;
  const canonicalStat = statSync(canonical);

  for (const duplicate of duplicates) {
    const duplicateStat = statSync(duplicate);
    duplicateFiles += 1;
    duplicateBytes += duplicateStat.size;

    if (!apply || (canonicalStat.dev === duplicateStat.dev && canonicalStat.ino === duplicateStat.ino)) {
      continue;
    }

    const temporaryLink = join(dirname(duplicate), `.dedupe-${process.pid}-${linkedFiles}`);
    linkSync(canonical, temporaryLink);
    renameSync(temporaryLink, duplicate);
    linkedFiles += 1;
  }
}

const duplicateMegabytes = (duplicateBytes / 1024 / 1024).toFixed(2);
console.log(
  `asset_duplicates=${duplicateFiles} duplicate_mb=${duplicateMegabytes} hardlinked=${linkedFiles} mode=${apply ? "apply" : "check"}`,
);

if (!apply && duplicateFiles > 0) {
  console.log(`Run \"node ${relative(process.cwd(), import.meta.filename)} --apply\" on a disposable build copy to hardlink duplicates.`);
}
