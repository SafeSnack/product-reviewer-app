import type { AllergenKey, DetectionResult } from '@safesnack/shared-types';
import { ALLERGEN_LABELS } from '@safesnack/shared-types';
import { SYNONYMS } from '@safesnack/allergen-engine/synonyms';

const BANNER_ATTR = 'data-safesnack-pdp-banner';
const HL_HOST_ATTR = 'data-safesnack-hl';

/** Public for tests — escape user-facing ingredient text when used inside RegExp constructors. */
export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export type HighlightPhraseSpec = {
  phrase: string;
  allergen: AllergenKey;
};

/**
 * Phrases from canonical synonym rows (aliases + ambiguous), longest-first, for case-insensitive
 * word-boundary matches in raw ingredient text. Only allergens in `keys` are included.
 */
export function buildHighlightSpecs(keys: Iterable<AllergenKey>): HighlightPhraseSpec[] {
  const want = new Set(keys);
  const collected: HighlightPhraseSpec[] = [];
  for (const row of SYNONYMS) {
    if (!want.has(row.allergen)) {
      continue;
    }
    for (const raw of row.aliases) {
      const p = raw.trim();
      if (p.length < 3) {
        continue;
      }
      collected.push({ phrase: raw, allergen: row.allergen });
    }
    for (const raw of row.ambiguous ?? []) {
      const p = raw.trim();
      if (p.length < 3) {
        continue;
      }
      collected.push({ phrase: raw, allergen: row.allergen });
    }
  }
  collected.sort((a, b) => b.phrase.length - a.phrase.length);
  const seen = new Set<string>();
  const deduped: HighlightPhraseSpec[] = [];
  for (const item of collected) {
    const k = item.phrase.toLowerCase();
    if (seen.has(k)) {
      continue;
    }
    seen.add(k);
    deduped.push(item);
  }
  return deduped;
}

function formatAllergenLabels(keys: readonly AllergenKey[]): string {
  return keys.map((k) => ALLERGEN_LABELS[k]).join(', ');
}

/** PDP banner lines (emoji + controlled copy). */
export function buildPdpBannerLines(r: DetectionResult): string[] {
  const lines: string[] = [];
  if (r.allergens.length > 0) {
    lines.push(`🔴 Unsafe for your profile — contains: ${formatAllergenLabels(r.allergens)}`);
  }
  if (r.mayContain.length > 0) {
    lines.push(`🟡 May contain: ${formatAllergenLabels(r.mayContain)}`);
  }
  if (
    r.allergens.length === 0 &&
    r.mayContain.length === 0 &&
    r.ingredientsFound &&
    r.confidence >= 0.5
  ) {
    lines.push('No flagged allergens detected in this ingredient list for your profile.');
  }
  if (!r.ingredientsFound || r.confidence < 0.5) {
    lines.push('Ingredient information is limited or unclear for automated checks.');
  }
  lines.push('✅ Always verify packaging. Ingredient data may be outdated.');
  return lines;
}

const HL_MARK_CLASS = 'safesnack-hl-mark';

function shadowCssForAllergen(allergen: AllergenKey): string {
  const palette: Partial<Record<AllergenKey, { bg: string; fg: string }>> = {
    milk: { bg: '#fef9c3', fg: '#111827' },
    egg: { bg: '#ffedd5', fg: '#111827' },
    fish: { bg: '#dbeafe', fg: '#111827' },
    shellfish: { bg: '#bae6fd', fg: '#111827' },
    tree_nut: { bg: '#fce7f3', fg: '#111827' },
    peanut: { bg: '#fee2e2', fg: '#111827' },
    wheat: { bg: '#fef3c7', fg: '#111827' },
    soy: { bg: '#dcfce7', fg: '#111827' },
    sesame: { bg: '#f3e8ff', fg: '#111827' },
    mustard: { bg: '#fef08a', fg: '#111827' },
  };
  const { bg, fg } = palette[allergen] ?? { bg: '#fef08a', fg: '#111827' };
  return `
:host {
  display: inline;
  vertical-align: baseline;
  line-height: inherit;
  font-size: inherit;
  font-family: inherit;
}
${HL_MARK_CLASS} {
  display: inline;
  margin: 0;
  padding: 0 2px;
  border-radius: 2px;
  background: ${bg};
  color: ${fg};
  font: inherit;
  line-height: inherit;
}
`.trim();
}

function createShadowHighlightHost(match: string, allergen: AllergenKey): HTMLSpanElement {
  const host = document.createElement('span');
  host.className = `safesnack-hl safesnack-hl-${allergen}`;
  host.setAttribute(HL_HOST_ATTR, 'true');
  host.setAttribute('data-allergen', allergen);
  const root = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = shadowCssForAllergen(allergen);
  const mark = document.createElement('mark');
  mark.className = HL_MARK_CLASS;
  mark.appendChild(document.createTextNode(match));
  root.appendChild(style);
  root.appendChild(mark);
  return host;
}

/** Exported for unit tests — picks earliest / longest word-boundary synonym hit in raw text. */
export function findBestWordBoundaryMatch(
  text: string,
  specs: readonly HighlightPhraseSpec[],
): { start: number; end: number; allergen: AllergenKey } | null {
  let best: { start: number; end: number; allergen: AllergenKey } | null = null;
  for (const spec of specs) {
    const re = new RegExp(`\\b${escapeRegex(spec.phrase)}\\b`, 'gi');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const start = m.index;
      const end = start + m[0].length;
      if (
        !best ||
        start < best.start ||
        (start === best.start && end - start > best.end - best.start)
      ) {
        best = { start, end, allergen: spec.allergen };
      }
    }
  }
  return best;
}

function wrapTextNode(textNode: Text, specs: readonly HighlightPhraseSpec[]): void {
  let node: Text | null = textNode;
  while (node && node.nodeValue && node.nodeValue.length > 0) {
    const text: string = node.nodeValue;
    const hit = findBestWordBoundaryMatch(text, specs);
    if (!hit) {
      return;
    }
    const before = text.slice(0, hit.start);
    const match = text.slice(hit.start, hit.end);
    const after: string = text.slice(hit.end);
    const parent = node.parentNode;
    if (!parent) {
      return;
    }
    const frag = document.createDocumentFragment();
    if (before) {
      frag.appendChild(document.createTextNode(before));
    }
    frag.appendChild(createShadowHighlightHost(match, hit.allergen));
    const afterNode: Text | null = after ? document.createTextNode(after) : null;
    if (afterNode) {
      frag.appendChild(afterNode);
    }
    parent.replaceChild(frag, node);
    node = afterNode;
  }
}

function shouldHighlightTextNode(node: Node): boolean {
  if (node.nodeType !== Node.TEXT_NODE || !node.nodeValue || !node.nodeValue.trim()) {
    return false;
  }
  let el: Element | null = (node as Text).parentElement;
  while (el) {
    if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'NOSCRIPT') {
      return false;
    }
    if (el.hasAttribute(HL_HOST_ATTR)) {
      return false;
    }
    el = el.parentElement;
  }
  return true;
}

function collectHighlightableTextNodes(root: Node, out: Text[]): void {
  if (root.nodeType === Node.TEXT_NODE) {
    if (shouldHighlightTextNode(root)) {
      out.push(root as Text);
    }
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
    return;
  }
  const el = root as Element;
  if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'NOSCRIPT') {
    return;
  }
  if (el.hasAttribute(HL_HOST_ATTR)) {
    return;
  }
  for (const child of Array.from(el.childNodes)) {
    collectHighlightableTextNodes(child, out);
  }
}

function highlightIngredientsTextNodes(root: Element, specs: readonly HighlightPhraseSpec[]): void {
  if (specs.length === 0) {
    return;
  }
  const pending: Text[] = [];
  collectHighlightableTextNodes(root, pending);
  for (const t of pending) {
    if (t.isConnected) {
      wrapTextNode(t, specs);
    }
  }
}

function visibleHighlightText(host: HTMLElement): string {
  const sr = host.shadowRoot;
  const mark = sr?.querySelector('mark');
  return mark?.textContent ?? '';
}

function unwrapHighlights(root: Element): void {
  const hosts = root.querySelectorAll(`span[${HL_HOST_ATTR}]`);
  for (const el of Array.from(hosts)) {
    const parent = el.parentNode;
    if (!parent) {
      continue;
    }
    const text = visibleHighlightText(el as HTMLElement);
    parent.replaceChild(document.createTextNode(text), el);
  }
  root.normalize();
}

/**
 * Inserts summary banner before `insertBefore` and highlights synonym matches only inside
 * `highlightRoot` text nodes (no structural rewrite of host markup beyond text splits).
 */
export function mountPdpUi(opts: {
  insertBefore: Element;
  highlightRoot: Element;
  detection: DetectionResult;
}): () => void {
  const bannerLines = buildPdpBannerLines(opts.detection);
  const keys = new Set<AllergenKey>([...opts.detection.allergens, ...opts.detection.mayContain]);
  const specs = buildHighlightSpecs(keys);

  const banner = document.createElement('div');
  banner.setAttribute(BANNER_ATTR, 'true');
  banner.style.cssText = [
    'margin-bottom:12px',
    'padding:12px',
    'border:1px solid #e5e7eb',
    'border-radius:8px',
    'background:#f9fafb',
    'font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif',
    'font-size:13px',
    'line-height:1.5',
    'color:#111827',
    'max-width:100%',
    'box-sizing:border-box',
  ].join(';');

  for (const line of bannerLines) {
    const p = document.createElement('p');
    p.style.margin = '0 0 6px 0';
    p.appendChild(document.createTextNode(line));
    banner.appendChild(p);
  }

  const parent = opts.insertBefore.parentNode;
  parent?.insertBefore(banner, opts.insertBefore);

  try {
    highlightIngredientsTextNodes(opts.highlightRoot, specs);
  } catch {
    // Highlighting must never break the PDP (attachShadow / TreeWalker host quirks).
  }

  return () => {
    try {
      banner.remove();
      unwrapHighlights(opts.highlightRoot);
    } catch {
      // ignore
    }
  };
}
