import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

export type RendererAuditEntry = {
  slug: string;
  modulePath: string;
  exportName: string;
  ceremonyRendering: string;
};

// Read the registry that production actually consumes. A new catalog entry
// without a resolvable renderer fails discovery instead of silently skipping.
export function templateRendererInventory(): Map<string, RendererAuditEntry> {
  const entries = new Map<string, RendererAuditEntry>();
  for (const file of ["src/components/chungdoi-demo.tsx", "src/components/generated/template-renderers.tsx"]) {
    const source = readFileSync(path.join(process.cwd(), file), "utf8");
    const refs = new Map([...source.matchAll(/const (\w+) = dynamic\(\(\) => import\("([^"]+)"\)\.then\(\((?:m|module)\) => (?:m|module)\.(\w+)\)\);/g)]
      .map((match) => [match[1], { modulePath: path.join(process.cwd(), match[2].replace(/^@\//, "src/")) + ".tsx", exportName: match[3] }]));
    const registrations = [
      ...source.matchAll(/"([^"]+)": templateRendererEntry\((\w+), "([^"]+)"\)/g),
      ...source.matchAll(/"([^"]+)": \{ component: (\w+), ceremonyRendering: "([^"]+)" \}/g),
    ];
    for (const [, slug, reference, ceremonyRendering] of registrations) {
      const component = refs.get(reference);
      assert.ok(component, `${slug}: resolve the actual renderer ${reference} from ${file}`);
      entries.set(slug, { slug, ...component, ceremonyRendering });
    }
  }
  return entries;
}
