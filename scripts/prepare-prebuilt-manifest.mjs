import { readFileSync, writeFileSync } from "node:fs";
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const fields = ["name", "version", "private", "engines", "overrides", "dependencies", "devDependencies", "optionalDependencies", "peerDependencies", "peerDependenciesMeta", "bundleDependencies", "packageManager", "workspaces"];
const manifest = Object.fromEntries(fields.filter((key) => pkg[key] !== undefined).map((key) => [key, pkg[key]]));
writeFileSync(process.argv[2], JSON.stringify(manifest, null, 2) + "\n");
