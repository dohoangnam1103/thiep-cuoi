/** Resource work only: never mounts effects, submits forms or plays media. */
export function cssImageUrls(value: string): string[] {
  return [...value.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)]
    .map((match) => match[1].trim())
    .filter((url) => !url.startsWith("data:") && !url.startsWith("#"));
}

export function waitForImage(image: HTMLImageElement, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      image.removeEventListener("load", loaded);
      image.removeEventListener("error", finish);
      signal.removeEventListener("abort", finish);
      resolve();
    };
    const loaded = () => {
      // A failed image must not prevent preparation of the rest of the card.
      if (typeof image.decode !== "function") return finish();
      void image.decode().catch(() => {}).then(finish);
    };
    if (signal.aborted) return finish();
    signal.addEventListener("abort", finish, { once: true });
    image.addEventListener("load", loaded, { once: true });
    image.addEventListener("error", finish, { once: true });
    if (image.complete) loaded();
  });
}

function nextVisiblePaint(signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    let frame = 0;
    const finish = () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", schedule);
      signal.removeEventListener("abort", finish);
      resolve();
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      if (document.visibilityState === "hidden") return;
      // The browser gets a paint opportunity between these two frames.
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(finish);
      });
    };
    if (signal.aborted) return finish();
    signal.addEventListener("abort", finish, { once: true });
    document.addEventListener("visibilitychange", schedule);
    schedule();
  });
}

/** Also catches CSS background artwork and fonts used only by hidden detail. */
export function createAssetWarmer(signal: AbortSignal) {
  const seen = new Set<string>();
  const images: HTMLImageElement[] = [];
  return (root: HTMLElement): Promise<void> => {
    const pending: Promise<unknown>[] = [];
    for (const element of [root, ...root.querySelectorAll<HTMLElement>("*")]) {
      const style = getComputedStyle(element);
      for (const url of cssImageUrls(style.backgroundImage)) {
        if (seen.has(url)) continue;
        seen.add(url);
        const image = new Image();
        image.decoding = "async";
        image.fetchPriority = "low";
        image.src = url;
        images.push(image);
        pending.push(waitForImage(image, signal));
      }
      const text = [...element.childNodes]
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent).join("").trim().slice(0, 128);
      if (!text || !document.fonts) continue;
      const font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const key = `${font}:${text}`;
      if (seen.has(key)) continue;
      seen.add(key);
      pending.push(document.fonts.load(font, text).catch(() => {}));
    }
    return Promise.all(pending).then(() => {});
  };
}

export async function waitForCoverPaint(root: HTMLElement, signal: AbortSignal): Promise<void> {
  const warm = createAssetWarmer(signal);
  await Promise.all([
    warm(root),
    ...[...root.querySelectorAll<HTMLImageElement>("img")].map((image) => waitForImage(image, signal)),
  ]);
  if (!signal.aborted) await nextVisiblePaint(signal);
}
