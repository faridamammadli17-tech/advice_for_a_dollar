/**
 * Loading delivered artwork.
 *
 * Until now every sprite was a character grid — fine for DRAFT placeholders and
 * for the diagnostic test card, but real art arrives as PNG files. This is the
 * second source a sprite can have.
 *
 * Images are cached by URL and loaded once. A sprite that is still loading
 * simply does not paint yet rather than flashing a placeholder, because a
 * one-frame flicker of a hatched block is worse than a one-frame gap.
 */

const loaded = new Map<string, HTMLImageElement>();
const inFlight = new Map<string, Promise<HTMLImageElement>>();

export function getLoadedImage(src: string): HTMLImageElement | null {
  return loaded.get(src) ?? null;
}

export function loadSpriteImage(src: string): Promise<HTMLImageElement> {
  const already = loaded.get(src);
  if (already) return Promise.resolve(already);

  const pending = inFlight.get(src);
  if (pending) return pending;

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      loaded.set(src, image);
      inFlight.delete(src);
      resolve(image);
    };
    image.onerror = () => {
      inFlight.delete(src);
      reject(new Error(`Could not load sprite artwork: ${src}`));
    };
    image.src = src;
  });

  inFlight.set(src, promise);
  return promise;
}

/**
 * Every PNG in the assets folder, keyed by filename.
 *
 * `import.meta.glob` is what makes this work in a production build: Vite
 * rewrites each path to its hashed output URL and includes the file in the
 * bundle. Referencing '/src/pixel/assets/x.png' as a literal string would work
 * in development and 404 in production.
 */
const artUrls = import.meta.glob('./assets/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export const ART: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(artUrls).map(([path, url]) => [path.replace('./assets/', ''), url]),
);

/** Look up a delivered file by name. Returns null when it has not arrived yet. */
export function artUrl(filename: string): string | null {
  return ART[filename] ?? null;
}
