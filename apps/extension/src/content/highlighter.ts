import type { AllergenKey } from '@safesnack/shared-types';
import { ALIAS_TO_ALLERGEN, AMBIGUOUS_TO_ALLERGEN } from '@safesnack/allergen-engine';

const BANNER_ATTR = 'data-safesnack-pdp-banner';
const HL_MARK = 'safesnack-hl';

/** Longest-first phrases for case-insensitive highlighting (controlled dictionary only). */
export function buildHighlightPhrases(keys: Iterable<AllergenKey>): string[] {
  const want = new Set<AllergenKey>(keys);
  const phrases = new Set<string>();
  for (const map of [ALIAS_TO_ALLERGEN, AMBIGUOUS_TO_ALLERGEN]) {
    for (const [alias, ag] of map) {
      if (!want.has(ag) || alias.length < 3) {
        continue;
      }
      phrases.add(alias);
    }
  }
  return [...phrases].sort((a, b) => b.length - a.length);
}

function wrapTextNode(textNode: Text, phrases: readonly string[]): void {
  let node: Text | null = textNode;
  while (node && node.nodeValue && node.nodeValue.length > 0) {
    const text: string = node.nodeValue;
    const lower = text.toLowerCase();
    let bestStart = -1;
    let bestLen = 0;
    let bestAg: AllergenKey | undefined;
    for (const phrase of phrases) {
      const idx = lower.indexOf(phrase.toLowerCase());
      if (idx === -1) {
        continue;
      }
      const ag = ALIAS_TO_ALLERGEN.get(phrase) ?? AMBIGUOUS_TO_ALLERGEN.get(phrase);
      if (!ag) {
        continue;
      }
      if (bestStart === -1 || idx < bestStart || (idx === bestStart && phrase.length > bestLen)) {
        bestStart = idx;
        bestLen = phrase.length;
        bestAg = ag;
      }
    }
    if (bestStart === -1 || !bestAg) {
      return;
    }
    const before = text.slice(0, bestStart);
    const match = text.slice(bestStart, bestStart + bestLen);
    const after: string = text.slice(bestStart + bestLen);
    const parent = node.parentNode;
    if (!parent) {
      return;
    }
    const frag = document.createDocumentFragment();
    if (before) {
      frag.appendChild(document.createTextNode(before));
    }
    const mark = document.createElement('mark');
    mark.className = `${HL_MARK} ${HL_MARK}-${bestAg}`;
    mark.setAttribute('data-allergen', bestAg);
    mark.style.backgroundColor = '#fef08a';
    mark.style.color = '#111827';
    mark.style.borderRadius = '2px';
    mark.style.padding = '0 2px';
    mark.appendChild(document.createTextNode(match));
    frag.appendChild(mark);
    const afterNode: Text | null = after ? document.createTextNode(after) : null;
    if (afterNode) {
      frag.appendChild(afterNode);
    }
    parent.replaceChild(frag, node);
    node = afterNode;
  }
}

function highlightInSubtree(root: Element, phrases: readonly string[]): void {
  if (phrases.length === 0) {
    return;
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      let el: Element | null = node.parentElement;
      while (el) {
        if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'NOSCRIPT') {
          return NodeFilter.FILTER_REJECT;
        }
        if (el.classList.contains(HL_MARK)) {
          return NodeFilter.FILTER_REJECT;
        }
        el = el.parentElement;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const pending: Text[] = [];
  let n: Node | null = walker.nextNode();
  while (n) {
    if (n.nodeType === Node.TEXT_NODE && n.nodeValue && n.nodeValue.trim()) {
      pending.push(n as Text);
    }
    n = walker.nextNode();
  }
  for (const t of pending) {
    if (t.isConnected) {
      wrapTextNode(t, phrases);
    }
  }
}

function unwrapHighlights(root: Element): void {
  const marks = root.querySelectorAll(`mark.${HL_MARK}`);
  for (const el of Array.from(marks)) {
    const parent = el.parentNode;
    if (!parent) {
      continue;
    }
    parent.replaceChild(document.createTextNode(el.textContent ?? ''), el);
  }
  root.normalize();
}

/**
 * Inserts a summary banner before `insertBefore` and highlights controlled alias phrases in `highlightRoot`.
 * All dynamic strings are built from SafeSnack-controlled data (no host DOM text in HTML sinks).
 */
export function mountPdpUi(opts: {
  insertBefore: Element;
  highlightRoot: Element;
  bannerLines: readonly string[];
  phrases: readonly string[];
}): () => void {
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
  ].join(';');

  for (const line of opts.bannerLines) {
    const p = document.createElement('p');
    p.style.margin = '0 0 6px 0';
    p.appendChild(document.createTextNode(line));
    banner.appendChild(p);
  }

  const parent = opts.insertBefore.parentNode;
  parent?.insertBefore(banner, opts.insertBefore);

  try {
    highlightInSubtree(opts.highlightRoot, opts.phrases);
  } catch {
    // Highlighting must never break the PDP.
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
