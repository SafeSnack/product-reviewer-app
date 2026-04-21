import type { AllergenKey, BadgeState } from '@safesnack/shared-types';
import { ALLERGEN_LABELS } from '@safesnack/shared-types';

const HOST_ATTR = 'data-safesnack-badge-host';

const badgeCleanups = new WeakMap<HTMLElement, () => void>();

const COLORS: Record<BadgeState, string> = {
  safe: '#16a34a',
  unsafe: '#dc2626',
  unknown: '#d97706',
};

const BADGE_CSS = `
:host {
  display: block;
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2147483646;
  pointer-events: auto;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  font-size: 12px;
  line-height: 1.4;
  color: #111827;
}

.wrap {
  position: relative;
  outline: none;
}

.badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 700;
  font-size: 14px;
  cursor: default;
  border: 2px solid rgba(255, 255, 255, 0.9);
  box-sizing: border-box;
  animation: safesnack-fade-in 150ms ease-out;
  outline: none;
}

.badge:focus-visible {
  box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #2563eb;
}

@media (prefers-reduced-motion: reduce) {
  .badge {
    animation: none;
  }
}

@keyframes safesnack-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.tooltip {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  min-width: 220px;
  max-width: min(320px, 70vw);
  padding: 10px 12px;
  background: #ffffff;
  color: #111827;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12);
  opacity: 0;
  pointer-events: none;
  transition: opacity 120ms ease-out;
  z-index: 2;
}

@media (prefers-reduced-motion: reduce) {
  .tooltip {
    transition: none;
  }
}

.wrap:hover .tooltip,
.wrap:focus-within .tooltip {
  opacity: 1;
  pointer-events: auto;
}

.tooltip p {
  margin: 0 0 8px 0;
}

.tooltip p:last-child {
  margin-bottom: 0;
}

.disclaimer {
  font-size: 11px;
  color: #4b5563;
}

.link {
  margin-top: 8px;
  padding: 0;
  border: none;
  background: none;
  color: #2563eb;
  text-decoration: underline;
  cursor: pointer;
  font: inherit;
  text-align: left;
}

.link:hover {
  color: #1d4ed8;
}

.link:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}
`;

function formatAllergenList(keys: readonly AllergenKey[]): string {
  return keys.map((k) => ALLERGEN_LABELS[k]).join(', ');
}

function ariaLabelForState(state: BadgeState, mayContain: readonly AllergenKey[]): string {
  if (state === 'unknown' && mayContain.length > 0) {
    return 'SafeSnack: may contain flagged allergens for your profile — verify packaging';
  }
  switch (state) {
    case 'safe':
      return 'SafeSnack: no flagged allergens detected';
    case 'unsafe':
      return 'SafeSnack: contains listed allergens';
    case 'unknown':
      return 'SafeSnack: ingredient information unknown';
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}

function iconGlyph(state: BadgeState): string {
  switch (state) {
    case 'safe':
      return '✓';
    case 'unsafe':
      return '!';
    case 'unknown':
      return '?';
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}

function buildTooltipContent(props: BadgeProps, tooltipId: string): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'tooltip';
  panel.id = tooltipId;
  panel.setAttribute('role', 'tooltip');

  const pMain = document.createElement('p');
  const pDisclaimer = document.createElement('p');
  pDisclaimer.className = 'disclaimer';
  pDisclaimer.appendChild(document.createTextNode('Always verify packaging'));

  if (props.state === 'unsafe') {
    const contains = formatAllergenList(props.allergens);
    pMain.appendChild(
      document.createTextNode(contains ? `Contains: ${contains}` : 'Contains: (unspecified)'),
    );
    if (props.mayContain.length > 0) {
      const pMay = document.createElement('p');
      pMay.appendChild(
        document.createTextNode(`May contain: ${formatAllergenList(props.mayContain)}`),
      );
      panel.appendChild(pMain);
      panel.appendChild(pMay);
      panel.appendChild(pDisclaimer);
      return panel;
    }
    panel.appendChild(pMain);
    panel.appendChild(pDisclaimer);
    return panel;
  }

  if (props.state === 'safe') {
    pMain.appendChild(document.createTextNode('No flagged allergens detected'));
    panel.appendChild(pMain);
    panel.appendChild(pDisclaimer);
    return panel;
  }

  if (props.mayContain.length > 0) {
    pMain.appendChild(
      document.createTextNode(
        `May contain (your profile): ${formatAllergenList(props.mayContain)}. Not shown as green safe — verify packaging.`,
      ),
    );
    panel.appendChild(pMain);
    panel.appendChild(pDisclaimer);
    return panel;
  }

  pMain.appendChild(document.createTextNode('No ingredient info found'));
  panel.appendChild(pMain);
  panel.appendChild(pDisclaimer);

  if (props.onSubmitUnknown) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'link';
    btn.appendChild(document.createTextNode('Help us — submit ingredients'));
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      props.onSubmitUnknown?.();
    });
    panel.appendChild(btn);
  }

  return panel;
}

function renderShadow(shadow: ShadowRoot, props: BadgeProps): void {
  const tooltipId = `safesnack-tip-${Math.random().toString(36).slice(2, 10)}`;

  const style = document.createElement('style');
  style.textContent = BADGE_CSS;

  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  const badge = document.createElement('div');
  badge.className = 'badge';
  badge.tabIndex = 0;
  badge.style.backgroundColor = COLORS[props.state];
  badge.setAttribute('role', 'img');
  badge.setAttribute('aria-label', ariaLabelForState(props.state, props.mayContain));
  badge.setAttribute('aria-describedby', tooltipId);
  badge.appendChild(document.createTextNode(iconGlyph(props.state)));

  const tooltip = buildTooltipContent(props, tooltipId);

  wrap.appendChild(badge);
  wrap.appendChild(tooltip);

  shadow.replaceChildren(style, wrap);
}

function ensureTilePositioning(tile: HTMLElement): () => void {
  try {
    const position = globalThis.getComputedStyle(tile).position;
    if (position === 'static' || position === '') {
      const previous = tile.style.position;
      tile.style.position = 'relative';
      return () => {
        tile.style.position = previous;
      };
    }
  } catch {
    // ignore
  }
  return () => {};
}

function teardownExisting(tile: Element): void {
  const prev = tile.querySelector(`[${HOST_ATTR}]`) as HTMLElement | null;
  if (!prev) {
    return;
  }
  badgeCleanups.get(prev)?.();
}

export type BadgeProps = {
  state: BadgeState;
  allergens: AllergenKey[];
  mayContain: AllergenKey[];
  onSubmitUnknown?: () => void;
};

/**
 * Mounts a SafeSnack badge into `tile` (Shadow DOM). Idempotent: replaces any prior badge on this tile.
 * @returns Cleanup — removes the badge and restores tile positioning if the extension applied it.
 */
export function mountBadge(tile: Element, props: BadgeProps): () => void {
  teardownExisting(tile);

  const tileEl = tile as HTMLElement;
  const restorePosition = ensureTilePositioning(tileEl);

  const host = document.createElement('div');
  host.setAttribute(HOST_ATTR, 'true');
  host.style.pointerEvents = 'auto';

  const shadow = host.attachShadow({ mode: 'open' });
  renderShadow(shadow, props);

  let disposed = false;
  const cleanup = (): void => {
    if (disposed) {
      return;
    }
    disposed = true;
    badgeCleanups.delete(host);
    if (host.isConnected) {
      host.remove();
    }
    restorePosition();
  };

  badgeCleanups.set(host, cleanup);
  tile.appendChild(host);

  return cleanup;
}

/** Updates an existing badge on `tile`; no-op if none mounted. */
export function updateBadge(tile: Element, props: BadgeProps): void {
  const host = tile.querySelector(`[${HOST_ATTR}]`);
  const shadow = host?.shadowRoot;
  if (!shadow) {
    return;
  }
  renderShadow(shadow, props);
}
