import { access, rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const packageJson = path.join(root, "package.json");
const nextDirectory = path.join(root, ".next");

await access(packageJson);
await rm(nextDirectory, { recursive: true, force: true });
console.log(`Removed ${nextDirectory}`);
