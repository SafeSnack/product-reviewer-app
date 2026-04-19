/**
 * Amazon Fresh / retail search + PDP DOM selectors.
 * Amazon changes markup often — try arrays in order; first non-empty match wins.
 * All public APIs are defensive (try/catch, null on miss) so content scripts never throw into the host page.
 */

export const AMAZON_SELECTORS: {
  tile: string[];
  tileAsinAttr: string;
  tileTitle: string[];
  tileImage: string[];
  pdpTitle: string[];
  pdpIngredientsBlocks: string[];
  pdpBulletPoints: string[];
} = {
  /** Search / listing product tile containers (outer element usually carries `data-asin`). */
  tile: [
    '[data-component-type="s-search-result"]',
    'div.s-result-item[data-asin]:not([data-asin=""])',
    'div[data-asin]:not([data-asin=""]).sg-col-inner',
    'div.s-result-item',
    '.s-main-slot [data-asin]:not([data-asin=""])',
  ],
  /** Attribute on (or near) the tile that holds the ASIN. */
  tileAsinAttr: 'data-asin',
  /** Title text inside a search tile. */
  tileTitle: [
    'h2 a.a-link-normal span.a-text-normal',
    'h2 a span.a-text-normal',
    'h2 .a-text-normal',
    'h2 a span',
    'h2 span',
  ],
  /** Primary product image inside a tile. */
  tileImage: [
    'img.s-image',
    '.s-product-image-container img',
    'img[data-image-latency]',
    'img.s-image-wrapper-dynamic-slots',
  ],
  /** PDP product title. */
  pdpTitle: ['#productTitle', '#title #productTitle', 'span#productTitle'],
  /**
   * PDP ingredient-rich regions (valid `querySelector` CSS only).
   * `:contains()` is not supported in browsers — use `findIngredientsHeadingSection` fallback after these.
   */
  pdpIngredientsBlocks: [
    '#nic-ingredients_feature_div',
    '#nic-ingredients-ingredient-list-instructions_feature_div',
    '#importantInformation_feature_div',
    '[data-feature-name="importantInformation"]',
    '#productDetails_techSpec_section_1',
    '#detailBullets_feature_div',
  ],
  /** Feature bullets (sometimes ingredients appear only here). */
  pdpBulletPoints: [
    '#feature-bullets ul li span.a-list-item',
    '#feature-bullets .a-list-item',
    '#featurebullets_feature_div .a-list-item',
  ],
};

const ASIN_RE = /^[A-Z0-9]{10}$/i;

/**
 * Returns the first element matching any selector in order, or null.
 */
export function firstMatch(root: ParentNode, selectors: string[]): Element | null {
  for (const selector of selectors) {
    try {
      const el = root.querySelector(selector);
      if (el) {
        return el;
      }
    } catch {
      // Invalid selector for this browser — skip.
    }
  }
  return null;
}

function firstNonEmptyQueryAll(
  root: ParentNode,
  selectors: readonly string[],
): {
  index: number;
  selector: string;
  elements: Element[];
} | null {
  for (let i = 0; i < selectors.length; i++) {
    const selector = selectors[i]!;
    try {
      const nodes = root.querySelectorAll(selector);
      if (nodes.length > 0) {
        return { index: i, selector, elements: Array.from(nodes) };
      }
    } catch {
      // skip invalid
    }
  }
  return null;
}

function normalizeAsin(raw: string | null | undefined): string | null {
  if (!raw) {
    return null;
  }
  const t = raw.trim().toUpperCase();
  if (t.length !== 10 || !ASIN_RE.test(t)) {
    return null;
  }
  return t;
}

/**
 * Reads ASIN from the tile or the nearest ancestor that exposes `data-asin`.
 */
export function extractAsin(tile: Element): string | null {
  try {
    const attr = AMAZON_SELECTORS.tileAsinAttr;
    const host = tile.hasAttribute(attr) ? tile : tile.closest(`[${attr}]`);
    return normalizeAsin(host?.getAttribute(attr) ?? null);
  } catch {
    return null;
  }
}

function extractTitleFromTile(tile: Element): string | null {
  try {
    const titleEl = firstMatch(tile, [...AMAZON_SELECTORS.tileTitle]);
    const text = titleEl?.textContent?.replace(/\s+/g, ' ').trim();
    return text && text.length > 0 ? text : null;
  } catch {
    return null;
  }
}

function extractTextFromIngredientsBlock(block: Element): string | null {
  try {
    const direct = block.textContent?.replace(/\s+/g, ' ').trim();
    const paragraphs = block.querySelectorAll('p, li');
    if (paragraphs.length > 0) {
      const lines: string[] = [];
      for (const p of Array.from(paragraphs)) {
        const line = p.textContent?.replace(/\s+/g, ' ').trim();
        if (line && line.length > 1) {
          lines.push(line);
        }
      }
      const joined = lines.join('\n').trim();
      if (joined.length >= 3) {
        return joined;
      }
    }
    if (direct && direct.length >= 3) {
      return direct;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fallback: walk likely Amazon sections for a heading whose text is "Ingredients" (case-insensitive).
 */
function findIngredientsHeadingSection(root: ParentNode): string | null {
  try {
    const candidates = root.querySelectorAll(
      '.a-section, .a-row, [data-feature-name="importantInformation"] > *',
    );
    for (const sec of Array.from(candidates)) {
      const headers = sec.querySelectorAll('h2, h3, h4, h5, th, strong, b, .a-text-bold');
      for (const h of Array.from(headers)) {
        const label = h.textContent?.trim().toLowerCase();
        if (!label) {
          continue;
        }
        if (label === 'ingredients' || label.startsWith('ingredients')) {
          const body = sec.querySelector('p, .a-spacing-small, .a-spacing-base, td') ?? sec;
          const text = extractTextFromIngredientsBlock(body);
          if (text) {
            return text;
          }
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

function extractFromBulletPoints(root: ParentNode): string | null {
  try {
    const items = firstNonEmptyQueryAll(root, [...AMAZON_SELECTORS.pdpBulletPoints]);
    if (!items) {
      return null;
    }
    const lines: string[] = [];
    for (const el of items.elements) {
      const t = el.textContent?.replace(/\s+/g, ' ').trim();
      if (!t) {
        continue;
      }
      if (/ingredient/i.test(t)) {
        lines.push(t);
      }
    }
    const joined = lines.join('\n').trim();
    return joined.length >= 3 ? joined : null;
  } catch {
    return null;
  }
}

/**
 * Best-effort ingredients string from the current PDP (`document` by default).
 */
export function extractIngredientsFromPdp(root: ParentNode = document): string | null {
  try {
    for (const selector of AMAZON_SELECTORS.pdpIngredientsBlocks) {
      try {
        const block = root.querySelector(selector);
        if (block) {
          const text = extractTextFromIngredientsBlock(block);
          if (text) {
            return text;
          }
        }
      } catch {
        // continue
      }
    }
    const fromHeadings = findIngredientsHeadingSection(root);
    if (fromHeadings) {
      return fromHeadings;
    }
    return extractFromBulletPoints(root);
  } catch {
    return null;
  }
}

function devLog(message: string, payload?: Record<string, unknown>): void {
  if (!import.meta.env.DEV) {
    return;
  }
  // Dev-only: selector rot telemetry.
  globalThis.console.debug(`[SafeSnack][selectors] ${message}`, payload ?? '');
}

/**
 * Logs which selector tier matched (DEV builds only). Safe no-op in production.
 */
export function logSelectorCoverage(root: ParentNode = document): void {
  if (!import.meta.env.DEV) {
    return;
  }
  try {
    const tileHit = firstNonEmptyQueryAll(root, [...AMAZON_SELECTORS.tile]);
    if (tileHit) {
      const tilesWithAsin = tileHit.elements.filter((el) => extractAsin(el) !== null);
      const samples = tilesWithAsin.slice(0, 5).map((el) => ({
        asin: extractAsin(el),
        title: extractTitleFromTile(el),
      }));
      devLog('search tiles', {
        selectorIndex: tileHit.index,
        selector: tileHit.selector,
        rawCount: tileHit.elements.length,
        withAsin: tilesWithAsin.length,
        samples,
      });
    } else {
      devLog('search tiles', { selectorIndex: -1, withAsin: 0, samples: [] });
    }

    let pdpIngredientsIdx = -1;
    let pdpIngredientsSelector: string | null = null;
    for (let i = 0; i < AMAZON_SELECTORS.pdpIngredientsBlocks.length; i++) {
      const sel = AMAZON_SELECTORS.pdpIngredientsBlocks[i]!;
      try {
        if (root.querySelector(sel)) {
          pdpIngredientsIdx = i;
          pdpIngredientsSelector = sel;
          break;
        }
      } catch {
        // skip
      }
    }

    const titleHit = firstMatch(root, [...AMAZON_SELECTORS.pdpTitle]);
    const extracted = extractIngredientsFromPdp(root);
    devLog('pdp', {
      titleMatched: Boolean(titleHit),
      pdpIngredientsBlockIndex: pdpIngredientsIdx,
      pdpIngredientsSelector,
      ingredientsPreview: extracted ? extracted.slice(0, 200) : null,
      ingredientsLength: extracted?.length ?? 0,
    });
  } catch {
    // never throw from diagnostics
  }
}
