import {
  extractAsin,
  extractProductTitleFromTile,
  queryTilesWithFallbacks,
} from './selectors/amazon.js';

const DEBOUNCE_MS = 150;

/**
 * Watches the DOM for Amazon search tiles, debounces mutations, and invokes `onTile`
 * only when a tile with a new ASIN intersects the viewport (lazy).
 *
 * @returns Disposer — disconnects observers and clears pending debounce.
 */
export function startTileObserver(opts: {
  selectors: typeof import('./selectors/amazon.js').AMAZON_SELECTORS;
  onTile: (tile: Element, asin: string, title: string) => void;
}): () => void {
  const { selectors, onTile } = opts;
  const processedAsins = new Set<string>();
  const watched = new WeakSet<Element>();
  let debounceId: ReturnType<typeof globalThis.setTimeout> | undefined;

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) {
          continue;
        }
        const tile = entry.target as Element;
        const asin = extractAsin(tile, selectors.tileAsinAttr);
        if (!asin || processedAsins.has(asin)) {
          io.unobserve(tile);
          continue;
        }
        const title = extractProductTitleFromTile(tile, selectors.tileTitle) ?? '';
        processedAsins.add(asin);
        io.unobserve(tile);
        try {
          onTile(tile, asin, title);
        } catch {
          // Never let host-page callbacks break the content script.
        }
      }
    },
    { root: null, threshold: 0.01, rootMargin: '0px' },
  );

  const discover = (): void => {
    try {
      const tiles = queryTilesWithFallbacks(document, selectors.tile);
      for (const tile of tiles) {
        const asin = extractAsin(tile, selectors.tileAsinAttr);
        if (!asin || processedAsins.has(asin)) {
          continue;
        }
        if (watched.has(tile)) {
          continue;
        }
        watched.add(tile);
        io.observe(tile);
      }
    } catch {
      // ignore
    }
  };

  const scheduleDiscover = (): void => {
    globalThis.clearTimeout(debounceId);
    debounceId = globalThis.setTimeout(() => {
      debounceId = undefined;
      discover();
    }, DEBOUNCE_MS);
  };

  const mo = new MutationObserver(() => {
    scheduleDiscover();
  });

  const root = document.body ?? document.documentElement;
  mo.observe(root, { childList: true, subtree: true });
  discover();

  return () => {
    globalThis.clearTimeout(debounceId);
    debounceId = undefined;
    mo.disconnect();
    io.disconnect();
  };
}
