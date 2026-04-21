import type { AllergenKey } from '@safesnack/shared-types';
import { ALL_ALLERGENS, ALLERGEN_LABELS } from '@safesnack/shared-types';
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getSettings, saveSettings } from '../core/storage.js';
import { trackEvent } from '../services/analytics.js';

const AMZ_FRESH_URL = 'https://www.amazon.com/alm/storefront?almBrandId=QW1hem9uIEZyZXNo' as const;
const LANDING_URL = 'https://safesnack.co' as const;

const ALLERGEN_ACCENT: Record<AllergenKey, string> = {
  milk: 'text-sky-700',
  egg: 'text-amber-700',
  peanut: 'text-orange-800',
  tree_nut: 'text-lime-800',
  soy: 'text-green-800',
  wheat: 'text-yellow-800',
  fish: 'text-blue-800',
  shellfish: 'text-cyan-800',
  sesame: 'text-amber-900',
  mustard: 'text-yellow-900',
};

function AllergenGlyph({ allergen }: { allergen: AllergenKey }) {
  const cls = `h-5 w-5 shrink-0 ${ALLERGEN_ACCENT[allergen]}`;
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      />
    </svg>
  );
}

function openUrlInNewTab(url: string): void {
  if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
    void chrome.tabs.create({ url });
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

function orderedSelectedKeys(selected: ReadonlySet<AllergenKey>): AllergenKey[] {
  return ALL_ALLERGENS.filter((k) => selected.has(k));
}

function formatProtectedSummary(keys: AllergenKey[]): string {
  return keys.map((k) => ALLERGEN_LABELS[k]).join(', ');
}

type Step = 1 | 2 | 3;

export function Onboarding() {
  const [step, setStep] = useState<Step>(1);
  const [selected, setSelected] = useState<Set<AllergenKey>>(() => new Set());
  const stepTitleId = useId();
  const liveId = useId();
  const continueRef = useRef<HTMLButtonElement>(null);
  const shopRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    let alive = true;
    void getSettings().then((s) => {
      if (!alive) {
        return;
      }
      if (s.allergens.length > 0) {
        setSelected(new Set(s.allergens));
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (step === 2) {
      continueRef.current?.focus();
    }
    if (step === 3) {
      shopRef.current?.focus();
    }
  }, [step]);

  const toggleAllergen = useCallback((key: AllergenKey) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const selectedOrdered = useMemo(() => orderedSelectedKeys(selected), [selected]);

  const goToAllergenStep = useCallback(() => {
    setStep(2);
  }, []);

  const finishAllergenStep = useCallback(async () => {
    if (selected.size === 0) {
      return;
    }
    const allergens = orderedSelectedKeys(selected);
    await saveSettings({ allergens, onboardingCompleted: true });
    void trackEvent('onboarding_completed', { allergenCount: allergens.length });
    setStep(3);
  }, [selected]);

  const goBack = useCallback(() => {
    setStep((s) => (s === 3 ? 2 : s === 2 ? 1 : 1));
  }, []);

  const chipKeyHandler = useCallback(
    (key: AllergenKey, e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        toggleAllergen(key);
      }
    },
    [toggleAllergen],
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased">
      <a
        href="#onboarding-main"
        className="absolute left-3 top-3 z-50 -translate-y-16 rounded-md bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow ring-1 ring-slate-200 transition-transform duration-150 ease-out focus:translate-y-0 motion-reduce:transition-none motion-reduce:transform-none"
      >
        Skip to main content
      </a>

      <header className="border-b border-slate-200 bg-white px-4 py-3">
        <p className="text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
          SafeSnack
        </p>
      </header>

      <main
        id="onboarding-main"
        className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-8 pt-6"
        tabIndex={-1}
      >
        <div className="mb-4 flex items-center justify-between gap-2 text-xs text-slate-500">
          <span aria-live="polite">{`Step ${step} of 3`}</span>
          {step > 1 ? (
            <button
              type="button"
              className="rounded-md px-2 py-1 font-medium text-emerald-800 underline decoration-emerald-700/40 underline-offset-2 transition-colors duration-150 hover:text-emerald-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 motion-reduce:transition-none"
              onClick={goBack}
            >
              Back
            </button>
          ) : (
            <span className="invisible select-none" aria-hidden="true">
              Back
            </span>
          )}
        </div>

        {step === 1 && (
          <section className="flex flex-1 flex-col" aria-labelledby={stepTitleId} role="region">
            <h1 id={stepTitleId} className="text-2xl font-semibold leading-tight text-slate-900">
              Shop groceries online without reading every label.
            </h1>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              SafeSnack flags your allergens in real time on Amazon Fresh.
            </p>
            <div className="mt-auto flex flex-col gap-4 pt-10">
              <button
                type="button"
                className="min-h-[48px] rounded-xl bg-emerald-700 px-4 py-3 text-center text-base font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 motion-reduce:transition-none"
                onClick={goToAllergenStep}
              >
                Get started →
              </button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="flex flex-1 flex-col" aria-labelledby={stepTitleId} role="region">
            <h1 id={stepTitleId} className="text-2xl font-semibold leading-tight text-slate-900">
              Pick your allergens
            </h1>
            <p id={liveId} className="sr-only" aria-live="polite">
              {`${selected.size} allergen${selected.size === 1 ? '' : 's'} selected`}
            </p>
            <div
              className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-2"
              role="group"
              aria-label="Allergens to flag"
            >
              {ALL_ALLERGENS.map((key) => {
                const checked = selected.has(key);
                const label = ALLERGEN_LABELS[key];
                return (
                  <div
                    key={key}
                    role="checkbox"
                    aria-checked={checked}
                    aria-label={`${label}, ${checked ? 'selected' : 'not selected'}`}
                    tabIndex={0}
                    onKeyDown={(e) => chipKeyHandler(key, e)}
                    onClick={() => toggleAllergen(key)}
                    className={`flex min-h-[52px] cursor-pointer select-none items-center gap-3 rounded-xl border px-3 py-3 shadow-sm transition-colors duration-150 motion-reduce:transition-none ${
                      checked
                        ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600 ring-offset-2 ring-offset-slate-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700`}
                  >
                    <AllergenGlyph allergen={key} />
                    <span className="text-left text-sm font-medium text-slate-900">{label}</span>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-sm text-slate-600">
              You can change these anytime from the extension icon.
            </p>
            <div className="mt-auto flex flex-col gap-3 pt-8">
              {selected.size === 0 ? (
                <p className="text-sm text-amber-900" role="status">
                  Select at least one allergen to continue.
                </p>
              ) : null}
              <button
                ref={continueRef}
                type="button"
                disabled={selected.size === 0}
                className="min-h-[48px] rounded-xl bg-emerald-700 px-4 py-3 text-center text-base font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 enabled:cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 motion-reduce:transition-none"
                onClick={() => void finishAllergenStep()}
              >
                Continue
              </button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="flex flex-1 flex-col" aria-labelledby={stepTitleId} role="region">
            <h1 id={stepTitleId} className="text-2xl font-semibold leading-tight text-slate-900">
              Try it
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate-700">
              {`You're protected for: ${formatProtectedSummary(selectedOrdered)}`}
            </p>
            <div className="mt-auto flex flex-col gap-3 pt-10">
              <a
                ref={shopRef}
                href={AMZ_FRESH_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[48px] items-center justify-center rounded-xl bg-emerald-700 px-4 py-3 text-center text-base font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 motion-reduce:transition-none"
                onClick={(e) => {
                  e.preventDefault();
                  openUrlInNewTab(AMZ_FRESH_URL);
                }}
              >
                Shop Amazon Fresh →
              </a>
              <a
                href={LANDING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] rounded-lg px-2 py-2 text-center text-sm font-semibold text-emerald-800 underline decoration-emerald-700/40 underline-offset-2 transition-colors duration-150 hover:text-emerald-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 motion-reduce:transition-none"
              >
                See how it works
              </a>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 py-4">
        <p className="mx-auto max-w-lg text-center text-xs leading-relaxed text-slate-600">
          Always verify packaging. Ingredient data can be incomplete or change; SafeSnack is a
          helper, not medical advice.
        </p>
      </footer>
    </div>
  );
}
