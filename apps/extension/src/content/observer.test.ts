import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AMAZON_SELECTORS } from './selectors/amazon.js';

type IoCallback = IntersectionObserverCallback;

let lastIoCallback: IoCallback | undefined;

class MockMutationObserver {
  static last: MockMutationObserver | undefined;

  readonly observe = vi.fn();
  readonly disconnect = vi.fn();

  constructor(private readonly callback: MutationCallback) {
    MockMutationObserver.last = this;
  }

  emit(): void {
    this.callback([], this as unknown as MutationObserver);
  }
}

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];

  readonly observe = vi.fn((target: Element) => {
    this.observed.add(target);
  });
  readonly unobserve = vi.fn((target: Element) => {
    this.observed.delete(target);
  });
  readonly disconnect = vi.fn(() => {
    this.observed.clear();
  });

  private readonly observed = new Set<Element>();

  constructor(private readonly callback: IoCallback) {
    lastIoCallback = callback;
    MockIntersectionObserver.instances.push(this);
  }

  /** Test helper: deliver an intersection event to the latest observer. */
  static flushEntry(target: Element, isIntersecting: boolean): void {
    const cb = lastIoCallback;
    if (!cb) {
      return;
    }
    cb(
      [
        {
          target,
          isIntersecting,
          intersectionRatio: isIntersecting ? 1 : 0,
        } as IntersectionObserverEntry,
      ],
      {} as IntersectionObserver,
    );
  }
}

describe('startTileObserver', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    MockIntersectionObserver.instances = [];
    MockMutationObserver.last = undefined;
    lastIoCallback = undefined;
    vi.stubGlobal('MutationObserver', MockMutationObserver);
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.resetModules();
  });

  it('debounces mutation callbacks so discover runs once per 150ms burst', async () => {
    vi.resetModules();
    vi.stubGlobal('MutationObserver', MockMutationObserver);
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    const amazon = await import('./selectors/amazon.js');
    const discoverSpy = vi.spyOn(amazon, 'queryTilesWithFallbacks').mockReturnValue([]);
    const { startTileObserver } = await import('./observer.js');

    const dispose = startTileObserver({
      selectors: AMAZON_SELECTORS,
      onTile: vi.fn(),
    });

    discoverSpy.mockClear();

    const mo = MockMutationObserver.last;
    expect(mo).toBeDefined();
    mo!.emit();
    mo!.emit();
    vi.advanceTimersByTime(149);
    expect(discoverSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(discoverSpy).toHaveBeenCalledTimes(1);

    dispose();
    discoverSpy.mockRestore();
  });

  it('fires onTile once per ASIN when intersecting and does not duplicate', async () => {
    const { startTileObserver } = await import('./observer.js');
    const onTile = vi.fn();

    document.body.innerHTML = `
      <div data-asin="B0BBBBBBBB" data-component-type="s-search-result">
        <h2><span class="a-text-normal">One</span></h2>
      </div>
      <div data-asin="B0BBBBBBBB" data-component-type="s-search-result">
        <h2><span class="a-text-normal">Dup</span></h2>
      </div>
    `;

    const dispose = startTileObserver({
      selectors: AMAZON_SELECTORS,
      onTile,
    });

    const tiles = Array.from(document.querySelectorAll('[data-component-type="s-search-result"]'));
    expect(tiles.length).toBe(2);

    MockIntersectionObserver.flushEntry(tiles[0]!, true);
    expect(onTile).toHaveBeenCalledTimes(1);
    expect(onTile).toHaveBeenCalledWith(tiles[0]!, 'B0BBBBBBBB', 'One');

    MockIntersectionObserver.flushEntry(tiles[1]!, true);
    expect(onTile).toHaveBeenCalledTimes(1);

    dispose();
  });

  it('disposer disconnects observers and cancels pending debounce', async () => {
    const { startTileObserver } = await import('./observer.js');

    const dispose = startTileObserver({
      selectors: AMAZON_SELECTORS,
      onTile: vi.fn(),
    });

    const ioInstance = MockIntersectionObserver.instances[0];
    MockMutationObserver.last?.emit();
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    dispose();

    expect(ioInstance.disconnect).toHaveBeenCalled();
  });
});
