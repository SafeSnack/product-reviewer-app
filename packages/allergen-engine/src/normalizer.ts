import { MAY_CONTAIN_PHRASES } from './synonyms.js';

const CURLY_SINGLE = /[\u2018\u2019\u201A\u201B]/g;
const CURLY_DOUBLE = /[\u201C\u201D\u201E\u201F]/g;

/** Strip HTML/XML-style tags (ingredient panels often paste markup). */
function stripHtmlTags(s: string): string {
  return s.replace(/<[^>]*>/g, ' ');
}

/** Remove common markdown emphasis without mangling inner ingredient text too aggressively. */
function stripMarkdownEmphasis(s: string): string {
  let t = s;
  t = t.replace(/\*{2}([^*]+?)\*{2}/g, '$1');
  t = t.replace(/_{2}([^_]+?)_{2}/g, '$1');
  t = t.replace(/\*([^*]+?)\*/g, '$1');
  t = t.replace(/_([^_\s]+?)_/g, '$1');
  t = t.replace(/\*+/g, ' ');
  t = t.replace(/_+/g, ' ');
  return t;
}

/**
 * Normalize ingredient label text for matching: lowercase, straight quotes, collapsed whitespace,
 * HTML + light markdown cleanup. Parentheses kept. "May contain …" clauses stay intact.
 */
export function normalizeIngredientText(raw: string): string {
  if (!raw) return '';
  let s = stripHtmlTags(raw);
  s = s.replace(CURLY_SINGLE, "'").replace(CURLY_DOUBLE, '"');
  s = stripMarkdownEmphasis(s);
  s = s.toLowerCase();
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

function stripLeadingListMarkers(chunk: string): string {
  return chunk
    .replace(/^[\s•\u2022\u2023\u2043\u2219\-*]+/u, '')
    .replace(/^[\d]+[\.)]\s*/, '')
    .trim();
}

function stripLabelPrefixes(s: string): string {
  return s.replace(/^(ingredients|contains|other ingredients):\s*/i, '').trim();
}

/** Find first top-level balanced `( … )`; returns null if unbalanced or no `(`. */
function findBalancedParen(s: string): { before: string; inner: string; after: string } | null {
  const open = s.indexOf('(');
  if (open === -1) return null;
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    const c = s[i];
    if (c === '(') depth++;
    else if (c === ')') {
      depth--;
      if (depth === 0) {
        return {
          before: s.slice(0, open).trim(),
          inner: s.slice(open + 1, i).trim(),
          after: s.slice(i + 1).trim(),
        };
      }
    }
  }
  return null;
}

/**
 * Split on `,`, `;`, ` and `, `&` at depth 0 (ignore delimiters inside parentheses).
 */
function splitTopLevelDelimited(s: string): string[] {
  const parts: string[] = [];
  let buf = '';
  let depth = 0;
  let i = 0;
  const lower = s;

  const flush = () => {
    const t = buf.trim();
    if (t) parts.push(t);
    buf = '';
  };

  while (i < lower.length) {
    const c = lower[i];
    if (c === '(') {
      depth++;
      buf += c;
      i++;
      continue;
    }
    if (c === ')') {
      depth--;
      buf += c;
      i++;
      continue;
    }
    if (depth === 0) {
      if (c === ',' || c === ';') {
        flush();
        i++;
        continue;
      }
      if (c === '&') {
        flush();
        i++;
        continue;
      }
      if (lower.startsWith(' and ', i)) {
        flush();
        i += 5;
        continue;
      }
    }
    buf += c;
    i++;
  }
  flush();
  return parts;
}

function findMayContainSplitIndex(lower: string): number {
  const phrases = [...MAY_CONTAIN_PHRASES].sort((a, b) => b.length - a.length);
  let best = -1;
  for (const p of phrases) {
    let searchEnd = lower.length;
    while (searchEnd >= 0) {
      const idx = lower.lastIndexOf(p, searchEnd);
      if (idx === -1) break;
      const beforeChar = idx === 0 ? '\n' : lower[idx - 1];
      const boundaryOk = idx === 0 || /[^a-z0-9]/i.test(beforeChar);
      if (boundaryOk) {
        if (idx > best) best = idx;
        break;
      }
      searchEnd = idx - 1;
    }
  }
  return best;
}

function splitMayContainClause(s: string): { body: string; may?: string } {
  const idx = findMayContainSplitIndex(s);
  if (idx === -1) return { body: s };
  const may = s.slice(idx).trim().replace(/\.+$/u, '').trim();
  let body = s
    .slice(0, idx)
    .replace(/[.,;\s]+$/u, '')
    .trim();
  body = stripLabelPrefixes(body);
  return { body, may };
}

function tokenizePart(part: string, out: string[]): void {
  const t = stripLeadingListMarkers(part);
  if (!t) return;

  const paren = findBalancedParen(t);
  if (!paren) {
    out.push(t);
    return;
  }

  const { before, inner, after } = paren;
  if (before) out.push(before);
  if (inner) {
    for (const sub of splitTopLevelDelimited(inner)) {
      tokenizePart(sub, out);
    }
  }
  if (after) {
    tokenizePart(after, out);
  }
}

/**
 * Split ingredient declaration into atomic phrases for allergen matching.
 * Preserves a trailing may-contain / facility phrase as a single final token when present.
 */
export function tokenizeIngredients(raw: string): string[] {
  const normalized = normalizeIngredientText(raw);
  if (!normalized) return [];

  const stripped = stripLabelPrefixes(normalized);
  const { body, may } = splitMayContainClause(stripped);
  const out: string[] = [];

  for (const chunk of splitTopLevelDelimited(body)) {
    tokenizePart(chunk, out);
  }

  if (may) out.push(may);
  return out.filter(Boolean);
}
