import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

/** Immutable version files prevent a late, older render replacing a newer one. */
export function createOgImageCache(directory: string) {
  const pending = new Map<string, Promise<Buffer>>();

  async function prepare(version: string, render: () => Promise<Buffer>): Promise<Buffer> {
    const file = join(directory, `${version}.png`);
    try {
      return await readFile(file);
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) {
        console.error("Unable to read invitation thumbnail cache", error);
      }
    }

    const png = await render();
    const temporaryFile = `${file}.${randomUUID()}.tmp`;
    try {
      await mkdir(directory, { recursive: true });
      await writeFile(temporaryFile, png);
      await rename(temporaryFile, file);
    } catch (error) {
      // A full/unwritable cache must not prevent sharing a successfully rendered image.
      console.error("Unable to persist invitation thumbnail", error);
    } finally {
      await rm(temporaryFile, { force: true }).catch(() => {});
    }
    return png;
  }

  return {
    getOrCreate(version: string, render: () => Promise<Buffer>): Promise<Buffer> {
      if (!/^[a-f0-9]{16}$/.test(version)) {
        return Promise.reject(new Error("Invalid invitation thumbnail version"));
      }
      const existing = pending.get(version);
      if (existing) return existing;
      const job = prepare(version, render).finally(() => pending.delete(version));
      pending.set(version, job);
      return job;
    },
  };
}
