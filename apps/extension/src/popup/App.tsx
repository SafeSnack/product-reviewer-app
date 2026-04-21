import type { AllergenKey } from '@safesnack/shared-types';
import { ALL_ALLERGENS, ALLERGEN_LABELS } from '@safesnack/shared-types';
import { type KeyboardEvent, useEffect, useId, useRef } from 'react';
import { usePopupStore } from './store.js';

const FEEDBACK_MAILTO =
  'mailto:hello@safesnack.co?subject=' + encodeURIComponent('SafeSnack feedback');
const PRIVACY_URL = 'https://safesnack.co/privacy' as const;

function extensionVersion(): string {
  try {
    const v = chrome.runtime?.getManifest?.()?.version;
    return typeof v === 'string' && v.length > 0 ? v : '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function webStoreReviewUrl(): string | null {
  try {
    const id = chrome.runtime?.id;
    return typeof id === 'string' && id.length > 0
      ? `https://chromewebstore.google.com/detail/safesnack/${id}`
      : null;
  } catch {
    return null;
  }
}

function formatProtectingList(allergens: readonly AllergenKey[]): string {
  if (allergens.length === 0) {
    return 'None selected';
  }
  return allergens.map((k) => ALLERGEN_LABELS[k]).join(', ');
}

const CHIP_ACCENT: Record<AllergenKey, string> = {
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

function ChipGlyph({ allergen }: { allergen: AllergenKey }) {
  const cls = `h-4 w-4 shrink-0 ${CHIP_ACCENT[allergen]}`;
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

export function App() {
  const bootstrap = usePopupStore((s) => s.bootstrap);
  const dispose = usePopupStore((s) => s.dispose);
  const settings = usePopupStore((s) => s.settings);
  const scansToday = usePopupStore((s) => s.scansToday);
  const unsafeShown = usePopupStore((s) => s.unsafeShown);
  const submissionsThisSession = usePopupStore((s) => s.submissionsThisSession);
  const helpedCount = usePopupStore((s) => s.helpedCount);
  const allergenSectionOpen = usePopupStore((s) => s.allergenSectionOpen);
  const setAllergenSectionOpen = usePopupStore((s) => s.setAllergenSectionOpen);
  const toggleAllergen = usePopupStore((s) => s.toggleAllergen);

  const editorHeadingId = useId();
  const firstChipRef = useRef<HTMLDivElement | null>(null);
  const rateUrl = webStoreReviewUrl();

  useEffect(() => {
    void bootstrap();
    return () => {
      dispose();
    };
  }, [bootstrap, dispose]);

  useEffect(() => {
    if (!allergenSectionOpen) {
      return;
    }
    queueMicrotask(() => {
      firstChipRef.current?.focus();
    });
  }, [allergenSectionOpen]);

  const onChipKey = (key: AllergenKey, e: KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      void toggleAllergen(key);
    }
  };

  const protecting = formatProtectingList(settings.allergens);

  return (
    <div className="flex h-[480px] w-[360px] flex-col overflow-hidden bg-slate-50 text-slate-900">
      <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3 py-2.5">
        <h1 className="text-base font-semibold tracking-tight text-slate-900">SafeSnack</h1>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          v{extensionVersion()}
        </span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <section
          className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
          aria-label="Profile summary"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Protecting for
              </p>
              <p className="mt-1 text-sm leading-snug text-slate-800">{protecting}</p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-lg px-2 py-1 text-sm font-semibold text-emerald-800 underline decoration-emerald-700/40 underline-offset-2 transition-colors duration-150 hover:text-emerald-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 motion-reduce:transition-none"
              onClick={() => setAllergenSectionOpen(true)}
              aria-expanded={allergenSectionOpen}
              aria-controls="allergen-editor"
            >
              Edit
            </button>
          </div>
        </section>

        <section className="mt-3" aria-labelledby={editorHeadingId}>
          <button
            type="button"
            id={editorHeadingId}
            className="flex w-full items-center justify-between rounded-t-xl border border-b-0 border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 transition-colors duration-150 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 motion-reduce:transition-none"
            aria-expanded={allergenSectionOpen}
            aria-controls="allergen-editor"
            onClick={() => setAllergenSectionOpen(!allergenSectionOpen)}
          >
            <span>Allergens</span>
            <span className="text-slate-400" aria-hidden="true">
              {allergenSectionOpen ? '▾' : '▸'}
            </span>
          </button>
          {allergenSectionOpen ? (
            <div
              id="allergen-editor"
              className="rounded-b-xl border border-t-0 border-slate-200 bg-white p-2 pb-3 shadow-sm"
            >
              <p className="px-1 pb-2 text-xs text-slate-500">Tap to toggle; saves immediately.</p>
              <div
                className="grid grid-cols-2 gap-2"
                role="group"
                aria-label="Allergens to flag on Amazon Fresh"
              >
                {ALL_ALLERGENS.map((key, index) => {
                  const checked = settings.allergens.includes(key);
                  const label = ALLERGEN_LABELS[key];
                  return (
                    <div
                      key={key}
                      ref={index === 0 ? firstChipRef : undefined}
                      role="checkbox"
                      aria-checked={checked}
                      aria-label={`${label}, ${checked ? 'selected' : 'not selected'}`}
                      tabIndex={0}
                      onKeyDown={(e) => onChipKey(key, e)}
                      onClick={() => void toggleAllergen(key)}
                      className={`flex min-h-[44px] cursor-pointer select-none items-center gap-2 rounded-lg border px-2 py-2 text-left text-xs font-medium transition-colors duration-150 motion-reduce:transition-none ${
                        checked
                          ? 'border-emerald-600 bg-emerald-50 text-slate-900 ring-1 ring-emerald-600'
                          : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300'
                      } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700`}
                    >
                      <ChipGlyph allergen={key} />
                      <span>{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </section>

        <section className="mt-4 space-y-2 text-sm text-slate-700" aria-label="Activity">
          <p>
            <span className="font-medium text-slate-900">Products scanned today:</span> {scansToday}
          </p>
          <p>
            <span className="font-medium text-slate-900">Unsafe results shown:</span> {unsafeShown}
          </p>
          <p>
            <span className="font-medium text-slate-900">Submissions this session:</span>{' '}
            {submissionsThisSession}
          </p>
          <p>
            <span className="font-medium text-slate-900">Products submitted:</span> {helpedCount}
          </p>
        </section>
      </div>

      <footer className="shrink-0 border-t border-slate-200 bg-white px-3 py-2.5">
        <p className="text-center text-[11px] leading-snug text-slate-600">
          Always verify packaging. SafeSnack reads on-page data only; ingredient data can be wrong
          or incomplete.
        </p>
        <nav
          className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-semibold"
          aria-label="Footer links"
        >
          <a
            className="text-emerald-800 underline decoration-emerald-700/40 underline-offset-2 transition-colors duration-150 hover:text-emerald-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 motion-reduce:transition-none"
            href={FEEDBACK_MAILTO}
          >
            Feedback
          </a>
          <a
            className="text-emerald-800 underline decoration-emerald-700/40 underline-offset-2 transition-colors duration-150 hover:text-emerald-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 motion-reduce:transition-none"
            href={PRIVACY_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy
          </a>
          {rateUrl ? (
            <a
              className="text-emerald-800 underline decoration-emerald-700/40 underline-offset-2 transition-colors duration-150 hover:text-emerald-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 motion-reduce:transition-none"
              href={rateUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Rate on Web Store
            </a>
          ) : (
            <span className="text-slate-400">Rate on Web Store</span>
          )}
        </nav>
      </footer>
    </div>
  );
}
