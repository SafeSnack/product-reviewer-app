import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mountBadge, updateBadge } from './badge.js';

describe('badge', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  function getBadgeHost(tile: Element): HTMLElement | null {
    return tile.querySelector('[data-safesnack-badge-host]') as HTMLElement | null;
  }

  function getShadowBadge(tile: Element): HTMLElement | null {
    const host = getBadgeHost(tile);
    return (host?.shadowRoot?.querySelector('.badge') as HTMLElement) ?? null;
  }

  function getTooltip(tile: Element): HTMLElement | null {
    const host = getBadgeHost(tile);
    return (host?.shadowRoot?.querySelector('.tooltip') as HTMLElement) ?? null;
  }

  it('mounts Shadow DOM and uses scoped styles (background per state)', () => {
    const tile = document.createElement('div');
    document.body.appendChild(tile);

    const dispose = mountBadge(tile, { state: 'safe', allergens: [], mayContain: [] });
    const badge = getShadowBadge(tile);
    expect(badge).toBeTruthy();
    expect(badge!.style.backgroundColor).toBe('#16a34a');

    dispose();
    mountBadge(tile, { state: 'unsafe', allergens: ['milk'], mayContain: [] });
    expect(getShadowBadge(tile)!.style.backgroundColor).toBe('#dc2626');

    updateBadge(tile, { state: 'unknown', allergens: [], mayContain: [] });
    expect(getShadowBadge(tile)!.style.backgroundColor).toBe('#d97706');
  });

  it('is idempotent: second mount replaces the first host', () => {
    const tile = document.createElement('div');
    document.body.appendChild(tile);

    mountBadge(tile, { state: 'safe', allergens: [], mayContain: [] });
    expect(tile.querySelectorAll('[data-safesnack-badge-host]').length).toBe(1);

    const dispose = mountBadge(tile, { state: 'unknown', allergens: [], mayContain: [] });
    expect(tile.querySelectorAll('[data-safesnack-badge-host]').length).toBe(1);
    expect(getShadowBadge(tile)!.style.backgroundColor).toBe('#d97706');

    dispose();
    expect(getBadgeHost(tile)).toBeNull();
  });

  it('exposes role=img, aria-label, and keyboard focus on the badge', () => {
    const tile = document.createElement('div');
    document.body.appendChild(tile);
    mountBadge(tile, { state: 'unknown', allergens: [], mayContain: [] });

    const badge = getShadowBadge(tile)!;
    expect(badge.getAttribute('role')).toBe('img');
    expect(badge.getAttribute('aria-label')).toBe('SafeSnack: ingredient information unknown');
    expect(badge.tabIndex).toBe(0);
  });

  it('tooltip copy matches state (unsafe contains + may contain + packaging)', () => {
    const tile = document.createElement('div');
    document.body.appendChild(tile);
    mountBadge(tile, {
      state: 'unsafe',
      allergens: ['milk', 'egg'],
      mayContain: ['soy'],
    });

    const tip = getTooltip(tile)!;
    expect(tip.textContent).toContain('Contains: Milk, Egg');
    expect(tip.textContent).toContain('May contain: Soy');
    expect(tip.textContent).toContain('Always verify packaging');
  });

  it('safe tooltip shows no allergens + packaging', () => {
    const tile = document.createElement('div');
    document.body.appendChild(tile);
    mountBadge(tile, { state: 'safe', allergens: [], mayContain: [] });
    const tip = getTooltip(tile)!;
    expect(tip.textContent).toContain('No flagged allergens detected');
    expect(tip.textContent).toContain('Always verify packaging');
  });

  it('unknown tooltip shows copy and submit control when handler provided', () => {
    const tile = document.createElement('div');
    document.body.appendChild(tile);
    const onSubmitUnknown = vi.fn();
    mountBadge(tile, {
      state: 'unknown',
      allergens: [],
      mayContain: [],
      onSubmitUnknown,
    });
    const tip = getTooltip(tile)!;
    expect(tip.textContent).toContain('No ingredient info found');
    expect(tip.textContent).toContain('Help us — submit ingredients');

    const btn = tip.querySelector('button.link') as HTMLButtonElement;
    btn.click();
    expect(onSubmitUnknown).toHaveBeenCalledTimes(1);
  });

  it('cleanup removes host from tile', () => {
    const tile = document.createElement('div');
    document.body.appendChild(tile);
    const dispose = mountBadge(tile, { state: 'safe', allergens: [], mayContain: [] });
    expect(getBadgeHost(tile)).toBeTruthy();
    dispose();
    expect(getBadgeHost(tile)).toBeNull();
  });
});
