# SafeSnack — Implementation Plan (Agent-Executable)

> **Purpose:** Break the MVP from `SAFESNACK_PRD.md` into small, self-contained, verifiable tasks. Each task is written as a **detailed prompt** an agent (or you) can execute in order without additional context.
>
> **Rules for the executor:**
> 1. Execute tasks **in order**. Do not skip.
> 2. Every task ends with **acceptance criteria**. Do not move on until all pass.
> 3. Commit after each task with the specified message.
> 4. If a task fails, stop and debug. Do not work around it.
> 5. "Sprint" numbers match the PRD roadmap.

---

## Table of Contents

- [Phase 0 — Foundation (Sprint 0, Days 1–3)](#phase-0--foundation-sprint-0-days-13)
- [Phase 1 — Allergen Detection Engine (Days 4–6)](#phase-1--allergen-detection-engine-days-46)
- [Phase 2 — Extension Skeleton (Days 7–9)](#phase-2--extension-skeleton-days-79)
- [Phase 3 — Amazon Fresh Content Script (Days 10–13)](#phase-3--amazon-fresh-content-script-days-1013)
- [Phase 4 — Data Sources & Fallbacks (Days 14–16)](#phase-4--data-sources--fallbacks-days-1416)
- [Phase 5 — Popup & Onboarding (Days 17–19)](#phase-5--popup--onboarding-days-1719)
- [Phase 6 — Landing Page & Legal (Days 20–22)](#phase-6--landing-page--legal-days-2022)
- [Phase 7 — QA & Beta Prep (Days 23–26)](#phase-7--qa--beta-prep-days-2326)
- [Phase 8 — Chrome Web Store Submission (Days 27–30)](#phase-8--chrome-web-store-submission-days-2730)
- [Conventions](#conventions)

---

## Phase 0 — Foundation (Sprint 0, Days 1–3)

### Task 0.1 — Initialize the monorepo

> **Prompt:**
> Create a new Git repository named `safesnack` locally. Initialize a **pnpm workspace** with the following structure:
> ```
> safesnack/
> ├── apps/
> │   ├── extension/       # Chrome extension
> │   └── web/             # Next.js landing + (future) API
> ├── packages/
> │   ├── allergen-engine/ # pure-TS detection logic, shared
> │   └── shared-types/    # cross-package TS types
> ├── .github/workflows/
> ├── .gitignore
> ├── .nvmrc               # Node 20
> ├── package.json         # workspace root
> ├── pnpm-workspace.yaml
> ├── tsconfig.base.json
> ├── README.md
> └── LICENSE              # MIT
> ```
> - Use Node 20 LTS (pin in `.nvmrc` and `package.json#engines`).
> - Root `package.json` should only contain: `name`, `private: true`, `packageManager` (pnpm@9), workspace scripts (`build`, `lint`, `test`, `typecheck`), and dev deps (`typescript`, `@types/node`, `prettier`, `eslint`, `husky`, `lint-staged`).
> - Add `.gitignore` covering `node_modules`, `dist`, `.next`, `.vercel`, `.env*`, `*.log`, `.DS_Store`, `coverage`.
> - Add a root `tsconfig.base.json` with `strict: true`, `moduleResolution: "bundler"`, `target: "ES2022"`, path aliases:
>   ```json
>   {
>     "compilerOptions": {
>       "paths": {
>         "@safesnack/allergen-engine": ["packages/allergen-engine/src/index.ts"],
>         "@safesnack/shared-types": ["packages/shared-types/src/index.ts"]
>       }
>     }
>   }
>   ```
> - Configure Prettier (2-space indent, single quotes, trailing commas, 100 char line) and ESLint (with `@typescript-eslint`, `eslint-config-prettier`).
> - Wire Husky + lint-staged to run `prettier --write` and `eslint --fix` on staged files.
> - Create an initial `README.md` with the repo name, one-line pitch, and "Getting started" section (empty placeholders for now).
>
> **Acceptance criteria:**
> - [ ] `pnpm install` succeeds from root.
> - [ ] `pnpm -r typecheck` runs (no files yet, exits clean).
> - [ ] `git commit` triggers Husky and runs Prettier.
>
> **Commit:** `chore: initialize pnpm monorepo`

---

### Task 0.2 — Configure CI

> **Prompt:**
> Create `.github/workflows/ci.yml` that runs on `push` and `pull_request` to `main`:
> - Matrix: Node 20 on ubuntu-latest.
> - Steps: checkout → pnpm/action-setup@v4 (v9) → `pnpm install --frozen-lockfile` → `pnpm -r typecheck` → `pnpm -r lint` → `pnpm -r test` → `pnpm -r build`.
> - Cache pnpm store.
> - Fail fast.
>
> **Acceptance criteria:**
> - [ ] File exists and is valid YAML.
> - [ ] Pushing a commit triggers the workflow and it passes on the empty repo.
>
> **Commit:** `ci: add GitHub Actions pipeline`

---

### Task 0.3 — Shared types package

> **Prompt:**
> In `packages/shared-types/`, create a pure TypeScript package (no runtime deps) exporting the canonical types used across extension + backend. Reference `SAFESNACK_PRD.md` Section 11.
>
> Create `packages/shared-types/src/index.ts` with:
> ```ts
> export type AllergenKey =
>   | 'milk' | 'egg' | 'peanut' | 'tree_nut'
>   | 'soy' | 'wheat' | 'fish' | 'shellfish'
>   | 'sesame' | 'mustard';
>
> export const ALL_ALLERGENS: readonly AllergenKey[] = [
>   'milk','egg','peanut','tree_nut','soy','wheat','fish','shellfish','sesame','mustard',
> ] as const;
>
> export const ALLERGEN_LABELS: Record<AllergenKey, string> = {
>   milk: 'Milk', egg: 'Egg', peanut: 'Peanut', tree_nut: 'Tree Nuts',
>   soy: 'Soy', wheat: 'Wheat / Gluten', fish: 'Fish', shellfish: 'Shellfish',
>   sesame: 'Sesame', mustard: 'Mustard',
> };
>
> export type DetectionSource =
>   | 'amazon_dom' | 'off_api' | 'usda' | 'llm' | 'user_submission';
>
> export type DetectionResult = {
>   ingredientsFound: boolean;
>   ingredientsText: string | null;
>   allergens: AllergenKey[];
>   mayContain: AllergenKey[];
>   confidence: number;     // 0..1
>   source: DetectionSource;
> };
>
> export type BadgeState = 'safe' | 'unsafe' | 'unknown';
>
> export type LocalSettings = {
>   version: 1;
>   allergens: AllergenKey[];
>   customAvoid: string[];
>   uiPreferences: {
>     showBadgesOn: ('search' | 'pdp' | 'cart')[];
>     badgeStyle: 'minimal' | 'verbose';
>   };
>   installedAt: string;
>   onboardingCompleted: boolean;
> };
>
> export type CachedIngredient = {
>   productKey: string;
>   ingredientsText: string;
>   detectedAllergens: AllergenKey[];
>   mayContain: AllergenKey[];
>   source: DetectionSource;
>   fetchedAt: number;
>   ttl: number;
> };
>
> export const DEFAULT_SETTINGS = (): LocalSettings => ({
>   version: 1,
>   allergens: [],
>   customAvoid: [],
>   uiPreferences: {
>     showBadgesOn: ['search', 'pdp'],
>     badgeStyle: 'minimal',
>   },
>   installedAt: new Date().toISOString(),
>   onboardingCompleted: false,
> });
> ```
> Configure `package.json` with `name: "@safesnack/shared-types"`, `main: "src/index.ts"`, `types: "src/index.ts"`, a `typecheck` script.
> Create `tsconfig.json` extending the root base.
>
> **Acceptance criteria:**
> - [ ] `pnpm --filter @safesnack/shared-types typecheck` passes.
> - [ ] No runtime dependencies in this package.
>
> **Commit:** `feat(shared-types): define canonical types`

---

## Phase 1 — Allergen Detection Engine (Days 4–6)

> **Strategy:** Build the detection engine as a **pure, side-effect-free TypeScript package** with heavy unit tests before writing any extension code. This is the product's safety core. Get it right in isolation.

### Task 1.1 — Allergen synonym dictionary

> **Prompt:**
> In `packages/allergen-engine/src/synonyms.ts`, export a comprehensive synonym dictionary mapping each `AllergenKey` to hidden ingredient names. Research authoritative sources (FDA, FARE, Celiac Disease Foundation) and cover at minimum:
>
> - **milk:** milk, whey, casein, caseinate, caseinates, lactose, lactalbumin, lactoglobulin, ghee, butter, buttermilk, cream, half-and-half, cheese, yogurt, curd, kefir, custard, pudding, ice cream, milk solids, milk fat, milk powder, skim milk, condensed milk, evaporated milk, nougat, recaldent, rennet casein
> - **egg:** egg, eggs, albumin, albumen, globulin, lysozyme, lecithin (e322 — note: can be soy; keep but flag), livetin, ovalbumin, ovoglobulin, ovomucin, ovomucoid, ovotransferrin, ovovitellin, silici albuminate, simplesse, vitellin, mayonnaise, meringue, surimi
> - **peanut:** peanut, peanuts, groundnut, monkey nut, arachis oil, arachis hypogaea, mandelona, beer nuts, goober, peanut flour, peanut butter
> - **tree_nut:** almond, almonds, almond paste, brazil nut, brazil nuts, cashew, cashews, chestnut, chestnuts, hazelnut, hazelnuts, filbert, filberts, macadamia, macadamia nuts, pecan, pecans, pine nut, pine nuts, pinon, pistachio, pistachios, walnut, walnuts, marzipan, nougat, nut butter, nut oil, nut paste, gianduja, praline
> - **soy:** soy, soya, soybean, soybeans, edamame, tofu, tempeh, miso, natto, shoyu, tamari, textured vegetable protein, tvp, soy protein, soy lecithin, soy flour, soy sauce, soybean oil
> - **wheat:** wheat, gluten, semolina, durum, farina, spelt, kamut, einkorn, emmer, triticale, bulgur, couscous, seitan, atta, matzo, graham flour, wheat starch, hydrolyzed wheat protein, malt, malt extract, wheat germ, wheat bran
> - **fish:** fish, anchovy, anchovies, bass, catfish, cod, flounder, haddock, hake, halibut, herring, mahi mahi, perch, pike, pollock, salmon, sardine, sardines, snapper, sole, swordfish, tilapia, trout, tuna, caviar, roe, fish sauce, worcestershire (often contains anchovy)
> - **shellfish:** shellfish, crustacean, crab, crayfish, crawfish, lobster, prawn, prawns, shrimp, krill, langoustine, scampi, mollusk, clam, clams, cockle, mussel, mussels, octopus, oyster, oysters, scallop, scallops, squid, calamari, abalone, snail, escargot
> - **sesame:** sesame, sesame seed, sesame seeds, sesame oil, tahini, benne, sim sim, til, gingelly, halva, halvah
> - **mustard:** mustard, mustard seed, mustard seeds, mustard flour, mustard oil, dijon, whole grain mustard
>
> Export shape:
> ```ts
> import type { AllergenKey } from '@safesnack/shared-types';
>
> export type SynonymEntry = {
>   allergen: AllergenKey;
>   aliases: string[];          // lowercase, no punctuation
>   ambiguous?: string[];       // terms that MAY indicate the allergen (e.g. 'lecithin')
> };
>
> export const SYNONYMS: readonly SynonymEntry[] = [ /* ... */ ];
>
> export const ALIAS_TO_ALLERGEN: ReadonlyMap<string, AllergenKey>;  // computed
> export const AMBIGUOUS_TO_ALLERGEN: ReadonlyMap<string, AllergenKey>;
> ```
>
> Additionally export `MAY_CONTAIN_PHRASES: string[]` with phrases indicating trace risk:
> `['may contain', 'may contains', 'made in a facility', 'shared equipment', 'processed in a facility', 'manufactured on equipment', 'produced in a facility', 'may also contain']`.
>
> **Acceptance criteria:**
> - [ ] Each allergen has ≥ 5 aliases.
> - [ ] No duplicates across aliases.
> - [ ] All strings are lowercase, trimmed.
> - [ ] Module exports compile against `@safesnack/shared-types`.
>
> **Commit:** `feat(engine): allergen synonym dictionary`

---

### Task 1.2 — Text normalizer

> **Prompt:**
> Create `packages/allergen-engine/src/normalizer.ts` exporting:
> ```ts
> export function normalizeIngredientText(raw: string): string
> export function tokenizeIngredients(raw: string): string[]
> ```
>
> **`normalizeIngredientText`:**
> - Lowercase
> - Replace curly quotes with straight
> - Collapse whitespace
> - Preserve parentheses (they often contain sub-ingredients)
> - Preserve "may contain" phrases
> - Strip HTML tags if present
> - Strip markdown emphasis (`*`, `_`)
>
> **`tokenizeIngredients`:**
> - Split the list into atomic ingredient phrases
> - Split delimiters: `,`, `;`, ` and `, `&`
> - Parenthetical content → separate tokens preserving parent link (e.g. `"chocolate (milk, soy lecithin)"` → `['chocolate', 'milk', 'soy lecithin']`)
> - Strip leading bullet chars and numbers
> - Filter empty tokens
>
> **Acceptance criteria:**
> - [ ] Unit tests cover: empty string, single ingredient, parenthetical, HTML, "may contain" retention, mixed punctuation.
> - [ ] Tokenizer handles: `"Ingredients: Sugar, Milk Chocolate (sugar, cocoa butter, milk, soy lecithin, vanilla), Peanuts. May contain traces of tree nuts."` → yields tokens including `"milk"`, `"soy lecithin"`, `"peanuts"`, plus the may-contain phrase retained for downstream detection.
>
> **Commit:** `feat(engine): ingredient text normalizer`

---

### Task 1.3 — Core detector

> **Prompt:**
> Create `packages/allergen-engine/src/detect.ts` exporting:
> ```ts
> import type { AllergenKey, DetectionResult, DetectionSource } from '@safesnack/shared-types';
>
> export type DetectInput = {
>   ingredientsText: string | null | undefined;
>   source: DetectionSource;
>   targetAllergens: AllergenKey[];  // user's profile
>   customAvoid?: string[];
> };
>
> export function detectAllergens(input: DetectInput): DetectionResult;
> ```
>
> **Algorithm:**
> 1. If `ingredientsText` is null/empty → return `{ ingredientsFound: false, ingredientsText: null, allergens: [], mayContain: [], confidence: 0, source }`.
> 2. Normalize + tokenize.
> 3. Split text into two zones: **main list** and **may-contain zone** (any text after a `MAY_CONTAIN_PHRASES` match becomes may-contain zone).
> 4. For each token in main zone:
>    - Word-boundary regex match against `ALIAS_TO_ALLERGEN` keys → add to `allergens`.
>    - Word-boundary regex match against `AMBIGUOUS_TO_ALLERGEN` → add to `mayContain` (not main) unless disambiguated.
> 5. For each token in may-contain zone → add matches to `mayContain`.
> 6. `customAvoid` terms: include matches in `allergens` only if the term string appears as a standalone word.
> 7. Deduplicate both arrays; only return allergens that intersect `targetAllergens` (the user doesn't care about others).
> 8. Confidence:
>    - `1.0` if main-zone exact hit
>    - `0.6` if only may-contain
>    - `0.4` if only ambiguous
>    - `0` if no ingredients but text had keywords (guess)
> 9. Return full `DetectionResult`.
>
> Use regex with word boundaries, NOT `includes()` (avoid `butter` matching `peanut butter` as "peanut").
>
> **Acceptance criteria:**
> - [ ] Detector exported as pure function, no I/O, no console logs.
> - [ ] Handles all test cases in Task 1.4.
>
> **Commit:** `feat(engine): allergen detector core`

---

### Task 1.4 — Detector test suite

> **Prompt:**
> Add Vitest to `packages/allergen-engine` (`vitest`, `@vitest/coverage-v8`). Add script `"test": "vitest run"`, `"test:watch": "vitest"`.
>
> Create `packages/allergen-engine/src/detect.test.ts` covering **at minimum** these cases. Each test must assert the full `DetectionResult`.
>
> | # | Input ingredientsText | Target allergens | Expected allergens | Expected mayContain |
> |---|---|---|---|---|
> | 1 | `"Sugar, salt."` | `['milk']` | `[]` | `[]` |
> | 2 | `"Milk chocolate (sugar, cocoa, milk)."` | `['milk']` | `['milk']` | `[]` |
> | 3 | `"Peanuts, salt."` | `['peanut']` | `['peanut']` | `[]` |
> | 4 | `"Sugar. May contain peanuts."` | `['peanut']` | `[]` | `['peanut']` |
> | 5 | `"Whey protein, casein."` | `['milk']` | `['milk']` | `[]` |
> | 6 | `"Almonds, cashews."` | `['tree_nut','peanut']` | `['tree_nut']` | `[]` |
> | 7 | `"Peanut butter."` | `['peanut']` | `['peanut']` | `[]` |
> | 8 | `"Butter, salt."` | `['peanut']` | `[]` | `[]` (butter ≠ peanut butter) |
> | 9 | `"Soy lecithin."` | `['soy']` | `['soy']` | `[]` |
> | 10 | `"Lecithin."` | `['soy']` | `[]` | `['soy']` (ambiguous) |
> | 11 | `"Contains wheat and soy."` | `['wheat','soy']` | `['wheat','soy']` | `[]` |
> | 12 | `"Sugar. Manufactured on equipment that processes tree nuts and sesame."` | `['tree_nut','sesame']` | `[]` | `['tree_nut','sesame']` |
> | 13 | `"Semolina, durum wheat, salt."` | `['wheat']` | `['wheat']` | `[]` |
> | 14 | `"Tahini, sesame oil."` | `['sesame']` | `['sesame']` | `[]` |
> | 15 | `"Crab, shrimp."` | `['shellfish']` | `['shellfish']` | `[]` |
> | 16 | `"Anchovy paste."` | `['fish']` | `['fish']` | `[]` |
> | 17 | `""` | `['milk']` | `[]` (ingredientsFound=false) | `[]` |
> | 18 | `null` | `['milk']` | `[]` (ingredientsFound=false) | `[]` |
> | 19 | `"Ingredients: sugar; salt; dijon mustard."` | `['mustard']` | `['mustard']` | `[]` |
> | 20 | `"Worcestershire sauce."` | `['fish']` | `['fish']` | `[]` (anchovy implied via alias) |
>
> Add coverage threshold in `vitest.config.ts`: 90% lines / 85% branches.
>
> **Acceptance criteria:**
> - [ ] `pnpm --filter @safesnack/allergen-engine test` passes all 20 cases.
> - [ ] Coverage thresholds met.
>
> **Commit:** `test(engine): detector test suite`

---

## Phase 2 — Extension Skeleton (Days 7–9)

### Task 2.1 — Scaffold the extension app

> **Prompt:**
> In `apps/extension/`, scaffold a Chrome Manifest V3 extension using **Vite + `@crxjs/vite-plugin` v2** + **React 18** + **TypeScript** + **Tailwind CSS 3**.
>
> Dependencies:
> - runtime: `react`, `react-dom`, `zustand`, `@safesnack/shared-types` (workspace), `@safesnack/allergen-engine` (workspace)
> - dev: `vite`, `@crxjs/vite-plugin`, `@vitejs/plugin-react`, `typescript`, `@types/chrome`, `@types/react`, `@types/react-dom`, `tailwindcss`, `postcss`, `autoprefixer`, `vitest`, `happy-dom`
>
> Create `apps/extension/manifest.config.ts`:
> ```ts
> import { defineManifest } from '@crxjs/vite-plugin';
>
> export default defineManifest({
>   manifest_version: 3,
>   name: 'SafeSnack',
>   version: '0.1.0',
>   description: 'Flags food allergens on Amazon Fresh and other grocery sites.',
>   icons: {
>     16: 'icons/icon-16.png',
>     32: 'icons/icon-32.png',
>     48: 'icons/icon-48.png',
>     128: 'icons/icon-128.png',
>   },
>   action: {
>     default_popup: 'src/popup/index.html',
>     default_icon: 'icons/icon-32.png',
>   },
>   background: {
>     service_worker: 'src/background/index.ts',
>     type: 'module',
>   },
>   content_scripts: [
>     {
>       matches: ['https://www.amazon.com/*'],
>       js: ['src/content/amazon-fresh.ts'],
>       run_at: 'document_idle',
>     },
>   ],
>   permissions: ['storage', 'activeTab'],
>   host_permissions: [
>     'https://world.openfoodfacts.org/*',
>     'https://api.nal.usda.gov/*',
>   ],
>   web_accessible_resources: [
>     { resources: ['src/onboarding/index.html', 'assets/*'], matches: ['<all_urls>'] },
>   ],
> });
> ```
>
> File structure:
> ```
> apps/extension/
> ├── public/
> │   └── icons/
> │       ├── icon-16.png
> │       ├── icon-32.png
> │       ├── icon-48.png
> │       └── icon-128.png
> ├── src/
> │   ├── background/
> │   │   └── index.ts
> │   ├── content/
> │   │   └── amazon-fresh.ts
> │   ├── popup/
> │   │   ├── index.html
> │   │   ├── main.tsx
> │   │   ├── App.tsx
> │   │   └── styles.css
> │   ├── onboarding/
> │   │   ├── index.html
> │   │   ├── main.tsx
> │   │   └── Onboarding.tsx
> │   ├── core/
> │   │   ├── storage.ts
> │   │   ├── messaging.ts
> │   │   └── types.ts
> │   ├── services/
> │   │   ├── openFoodFacts.ts
> │   │   └── analytics.ts
> │   └── env.ts
> ├── manifest.config.ts
> ├── vite.config.ts
> ├── tailwind.config.ts
> ├── postcss.config.js
> ├── tsconfig.json
> └── package.json
> ```
>
> Placeholder icons: generate simple green square PNGs at each size (can replace with real logo later).
>
> Scripts in `package.json`:
> - `dev`: `vite`
> - `build`: `tsc --noEmit && vite build`
> - `typecheck`: `tsc --noEmit`
> - `test`: `vitest run`
>
> Stub content:
> - `src/background/index.ts`: `console.log('[SafeSnack] background worker ready');`
> - `src/content/amazon-fresh.ts`: `console.log('[SafeSnack] content script injected');`
> - `src/popup/App.tsx`: renders `<div className="p-4 text-sm">SafeSnack</div>`
>
> **Acceptance criteria:**
> - [ ] `pnpm --filter extension build` produces `dist/` with valid manifest.json.
> - [ ] Loading `dist/` as unpacked extension in Chrome:
>   - Background worker logs its message.
>   - Content script logs on `amazon.com`.
>   - Popup opens and shows "SafeSnack".
> - [ ] No console errors.
>
> **Commit:** `feat(extension): scaffold Manifest V3 with Vite + React`

---

### Task 2.2 — Storage layer

> **Prompt:**
> Implement `apps/extension/src/core/storage.ts`:
> ```ts
> import type { LocalSettings, CachedIngredient } from '@safesnack/shared-types';
> import { DEFAULT_SETTINGS } from '@safesnack/shared-types';
>
> export async function getSettings(): Promise<LocalSettings>
> export async function saveSettings(s: Partial<LocalSettings>): Promise<void>
> export function subscribeToSettings(cb: (s: LocalSettings) => void): () => void
>
> export async function getCached(productKey: string): Promise<CachedIngredient | null>
> export async function setCached(entry: CachedIngredient): Promise<void>
> export async function clearExpiredCache(): Promise<number>
> ```
>
> Rules:
> - Settings live in `chrome.storage.sync` (syncs across devices, 100KB limit).
> - Cache lives in `chrome.storage.local` (5MB limit).
> - Cache TTL default 30 days. `clearExpiredCache` returns count deleted.
> - `getSettings` merges stored settings with `DEFAULT_SETTINGS()` to handle schema upgrades.
> - `subscribeToSettings` uses `chrome.storage.onChanged` and returns an unsubscribe fn.
> - All functions return Promises, never throw on missing keys — return defaults/null.
>
> Add unit tests in `storage.test.ts` using `happy-dom` + a minimal `chrome.storage` mock.
>
> **Acceptance criteria:**
> - [ ] All 3 settings methods + 3 cache methods implemented and typed.
> - [ ] Tests cover: first-read returns defaults; write + read round-trip; subscribe fires on change; cache expiry works.
>
> **Commit:** `feat(extension): storage layer`

---

### Task 2.3 — Messaging protocol

> **Prompt:**
> Implement `apps/extension/src/core/messaging.ts` defining the typed message protocol between content script ↔ background ↔ popup.
>
> ```ts
> export type LookupRequest = {
>   type: 'LOOKUP_PRODUCT';
>   productKey: string;       // 'amazon:B07XYZ'
>   productName: string;
>   ingredientsFromDom?: string | null;
> };
>
> export type LookupResponse = {
>   type: 'LOOKUP_RESULT';
>   productKey: string;
>   result: DetectionResult | null;
>   error?: string;
> };
>
> export type SettingsChanged = {
>   type: 'SETTINGS_CHANGED';
>   settings: LocalSettings;
> };
>
> export type Message = LookupRequest | LookupResponse | SettingsChanged;
>
> export function sendMessage<R extends Message>(m: Message): Promise<R>;
> export function onMessage(handler: (m: Message, sender: chrome.runtime.MessageSender) => Promise<Message | void>): void;
> ```
>
> Wrap `chrome.runtime.sendMessage` in a Promise. Add 5-second timeout.
>
> **Acceptance criteria:**
> - [ ] Strict typed message union.
> - [ ] Rejects on timeout.
> - [ ] Works from both content script and popup contexts.
>
> **Commit:** `feat(extension): typed messaging protocol`

---

## Phase 3 — Amazon Fresh Content Script (Days 10–13)

### Task 3.1 — DOM selectors spike

> **Prompt:**
> Create `apps/extension/src/content/selectors/amazon.ts` with **resilient, multi-fallback** selectors for Amazon Fresh. Amazon changes DOM structure ~monthly; write selectors as **arrays tried in order** with the first successful match winning.
>
> Manually inspect these Amazon Fresh URLs (open them in Chrome DevTools, right-click → Copy selector) and extract:
>
> **Search/listing pages** (e.g. `/s?k=granola+bars`):
> - Product tile container: array of candidates like `['[data-component-type="s-search-result"]', 'div.s-result-item']`
> - Within tile: ASIN attribute (`data-asin`), product title (`h2 a span`), product image (`img.s-image`)
> - Product URL (relative): `h2 a`
>
> **Product Detail Page (PDP)** (e.g. `/dp/B0XXXXX`):
> - Title: `['#productTitle']`
> - Ingredients section — multiple locations possible:
>   - `['#important-information .a-section:has(h4:contains("Ingredients")) p']`
>   - `['[data-feature-name="importantInformation"] .a-section']`
>   - `['#nic-ingredients_feature_div']`
>   - Fallback: search all `.a-section` for heading text "Ingredients".
>
> Export:
> ```ts
> export const AMAZON_SELECTORS = {
>   tile: string[];
>   tileAsinAttr: string;    // 'data-asin'
>   tileTitle: string[];
>   tileImage: string[];
>   pdpTitle: string[];
>   pdpIngredientsBlocks: string[];
>   pdpBulletPoints: string[];   // '#feature-bullets .a-list-item'
> };
>
> export function firstMatch(root: ParentNode, selectors: string[]): Element | null;
> export function extractAsin(tile: Element): string | null;
> export function extractIngredientsFromPdp(): string | null;
> ```
>
> Add a dev-only debug function `logSelectorCoverage()` that logs which fallback matched, so we can track selector rot over time.
>
> **Acceptance criteria:**
> - [ ] Loading the extension on a real Amazon search page successfully extracts ≥ 10 tiles with ASINs and titles (verify by logging).
> - [ ] Loading on a real PDP extracts ingredients if present.
> - [ ] Gracefully returns null when selectors fail — never throws.
>
> **Commit:** `feat(content): resilient Amazon selectors`

---

### Task 3.2 — Tile observer

> **Prompt:**
> In `apps/extension/src/content/observer.ts`, implement a MutationObserver-based watcher that:
>
> - On page load, scans existing tiles.
> - On DOM mutation, detects newly added tiles (infinite scroll, filters).
> - Debounces: batches mutations within 150ms.
> - Uses IntersectionObserver to **only process tiles that enter the viewport** (lazy; saves API calls).
> - For each in-viewport new tile, emits `onTile(tile: Element, asin: string)` callback.
> - Tracks which ASINs it has already processed in-session (Set) to avoid duplicate work.
>
> Export:
> ```ts
> export function startTileObserver(opts: {
>   selectors: typeof AMAZON_SELECTORS;
>   onTile: (tile: Element, asin: string, title: string) => void;
> }): () => void;  // returns disposer
> ```
>
> **Acceptance criteria:**
> - [ ] Scrolling a search page processes tiles as they enter viewport, not all at once.
> - [ ] No duplicate callbacks for the same ASIN.
> - [ ] Disposer cleanly removes observers.
>
> **Commit:** `feat(content): lazy tile observer`

---

### Task 3.3 — Badge UI injector

> **Prompt:**
> Create `apps/extension/src/content/badge.ts` that injects a floating badge into a product tile.
>
> Requirements:
> - Shadow DOM root per badge — prevents Amazon's CSS from breaking our styles.
> - Three states: `safe` (green `#16a34a`), `unsafe` (red `#dc2626`), `unknown` (amber `#d97706`).
> - Badge position: absolute, top-right of tile, 8px inset.
> - Size: 32×32 circular, with icon + state text on hover.
> - Hover tooltip shows:
>   - Unsafe: `"Contains: {allergens}"` + `"Always verify packaging"`
>   - Safe: `"No flagged allergens detected"` + `"Always verify packaging"`
>   - Unknown: `"No ingredient info found"` + link `"Help us — submit ingredients"`
> - Accessible: `role="img"`, `aria-label` matches state.
> - Animates in with 150ms fade.
>
> API:
> ```ts
> export type BadgeProps = {
>   state: BadgeState;
>   allergens: AllergenKey[];
>   mayContain: AllergenKey[];
>   onSubmitUnknown?: () => void;
> };
>
> export function mountBadge(tile: Element, props: BadgeProps): () => void;  // returns cleanup
> export function updateBadge(tile: Element, props: BadgeProps): void;
> ```
>
> Badges must be idempotent: mounting twice replaces the first cleanly.
>
> **Acceptance criteria:**
> - [ ] Badge visually renders in all three states.
> - [ ] Tooltip content matches state.
> - [ ] Style is not broken by Amazon's global CSS.
> - [ ] Keyboard-focusable; tooltip shows on focus.
>
> **Commit:** `feat(content): badge UI component`

---

### Task 3.4 — Content script orchestration

> **Prompt:**
> Wire everything together in `apps/extension/src/content/amazon-fresh.ts`.
>
> On DOMContentLoaded:
> 1. Read user settings via message to background (or direct storage read).
> 2. Detect page type from URL: search/category (`/s?`, `/gp/browse`), PDP (`/dp/`, `/gp/product/`).
> 3. If settings have **no allergens selected** → do nothing (idle mode).
> 4. If search/category:
>    - Start tile observer.
>    - For each tile, request lookup via `sendMessage({ type: 'LOOKUP_PRODUCT', productKey: 'amazon:<asin>', productName })`.
>    - Mount badge in `unknown` state immediately.
>    - On response, update badge to `safe`/`unsafe`.
> 5. If PDP:
>    - Extract ingredients from DOM.
>    - Send to background for detection.
>    - Inject a **PDP summary banner** at the top of the product info section (use `highlighter` — see 3.5).
>    - Highlight allergen words inline inside ingredient text.
>
> Add `SPA navigation` handling: Amazon uses soft navigations. Re-run page-type detection on `popstate` and DOM title mutations.
>
> Error isolation: wrap everything in try/catch. An error on page X must not break page Y.
>
> **Acceptance criteria:**
> - [ ] Navigating Amazon search → PDP → back: both modes activate and deactivate correctly.
> - [ ] No memory leaks after 10 navigations (observer cleanup confirmed).
> - [ ] Badges persist across infinite scroll.
>
> **Commit:** `feat(content): orchestrate search + PDP flows`

---

### Task 3.5 — PDP ingredient highlighter

> **Prompt:**
> In `apps/extension/src/content/highlighter.ts`, implement a DOM highlighter that wraps allergen matches in a shadow-styled `<mark>` within the PDP ingredients block.
>
> Rules:
> - Operate only on the ingredients text node(s); never rewrite arbitrary DOM.
> - Use a `<span class="safesnack-hl-{allergen}">` wrapper with shadow CSS.
> - Preserve the original text exactly (no normalization in visible DOM).
> - Match case-insensitively using alias list from `@safesnack/allergen-engine/synonyms`.
> - Prepend a summary banner:
>   ```
>   🔴 Unsafe for your profile — contains: Milk, Soy
>   🟡 May contain: Peanut
>   ✅ Always verify packaging. Ingredient data may be outdated.
>   ```
>
> **Acceptance criteria:**
> - [ ] On a real PDP with known allergens, matches are highlighted inline.
> - [ ] Banner renders above ingredients.
> - [ ] Does not break Amazon's layout.
>
> **Commit:** `feat(content): PDP ingredient highlighter`

---

### Task 3.6 — Background lookup orchestration

> **Prompt:**
> Implement `apps/extension/src/background/index.ts`.
>
> Responsibilities:
> - Register message handler for `LOOKUP_PRODUCT`.
> - Lookup pipeline:
>   1. Check `getCached(productKey)`. If fresh → return cached `DetectionResult`.
>   2. If `ingredientsFromDom` is present → run `detectAllergens` directly → cache → return.
>   3. Else query Open Food Facts (Task 4.1). On hit → detect → cache → return.
>   4. On miss → return `{ result: null, error: 'not_found' }`; content script will show Unknown.
> - In-flight request deduplication: if two tiles ask for the same ASIN at once, only run one lookup.
> - On install (`chrome.runtime.onInstalled`) with `reason === 'install'`:
>   - Open `onboarding/index.html` in a new tab.
> - On settings change, broadcast `SETTINGS_CHANGED` to all tabs so content scripts can re-scan.
> - Daily alarm (`chrome.alarms`) to run `clearExpiredCache()`.
>
> **Acceptance criteria:**
> - [ ] Fresh install triggers onboarding.
> - [ ] First lookup for an ASIN hits network; second is from cache within TTL.
> - [ ] Duplicate concurrent requests collapsed.
> - [ ] Cache cleanup runs.
>
> **Commit:** `feat(background): lookup orchestration`

---

## Phase 4 — Data Sources & Fallbacks (Days 14–16)

### Task 4.1 — Open Food Facts integration

> **Prompt:**
> Implement `apps/extension/src/services/openFoodFacts.ts`.
>
> API: Open Food Facts REST API v2. Docs: https://openfoodfacts.github.io/openfoodfacts-server/api/
>
> ```ts
> export async function lookupByName(productName: string): Promise<OffProduct | null>;
> export async function lookupByBarcode(barcode: string): Promise<OffProduct | null>;
>
> export type OffProduct = {
>   id: string;
>   name: string;
>   brand?: string;
>   ingredientsText?: string;
>   allergensTags?: string[];     // e.g. 'en:milk'
>   tracesTags?: string[];
> };
> ```
>
> Implementation:
> - Strategy: Amazon PDP rarely has barcodes in DOM. Use `lookupByName` via search endpoint: `GET https://world.openfoodfacts.org/cgi/search.pl?search_terms=<name>&search_simple=1&json=1&page_size=1&fields=code,product_name,brands,ingredients_text_en,allergens_tags,traces_tags`.
> - Add a 5s timeout via `AbortController`.
> - Normalize `ingredients_text_en` (fallback to `ingredients_text`).
> - User-Agent header: `SafeSnack/0.1 (contact: hello@safesnack.co)` — required by OFF ToS.
> - Rate limit: local bucket of 10 req/min per tab (simple timestamp array). Queue excess.
> - Cache **negative** results for 24h (productName + "no match") to avoid repeated misses.
>
> **Acceptance criteria:**
> - [ ] Unit tests with `fetch` mocked: hit, miss, timeout, rate limit.
> - [ ] Integration test (manual): lookup real product name like "Cheerios Honey Nut" returns non-null result.
>
> **Commit:** `feat(services): Open Food Facts integration`

---

### Task 4.2 — Unknown submission queue

> **Prompt:**
> In `apps/extension/src/core/submissions.ts`, implement a local queue where users can submit missing ingredient info.
>
> ```ts
> export type Submission = {
>   productKey: string;
>   productName: string;
>   ingredientsText: string;
>   submittedAt: number;
>   status: 'queued' | 'synced';
> };
>
> export async function queueSubmission(s: Omit<Submission,'status'|'submittedAt'>): Promise<void>;
> export async function getQueuedSubmissions(): Promise<Submission[]>;
> ```
>
> MVP behavior: store in `chrome.storage.local` under key `submissions`. Sync endpoint is deferred to v2 (no backend in MVP). Popup shows count: "You've helped improve N products."
>
> Add a "Help us" modal in the PDP banner + unknown badge hover that:
> - Pre-fills productName
> - Lets user paste ingredient text
> - On submit: queue locally + immediately run detection + update badge
>
> **Acceptance criteria:**
> - [ ] Modal accessible from unknown badge + PDP banner.
> - [ ] Submission updates local cache so badge turns safe/unsafe immediately.
> - [ ] Queue persists across sessions.
>
> **Commit:** `feat(extension): user submissions queue`

---

## Phase 5 — Popup & Onboarding (Days 17–19)

### Task 5.1 — Onboarding flow

> **Prompt:**
> Implement `apps/extension/src/onboarding/Onboarding.tsx` as a 3-step flow:
>
> **Step 1 — Welcome**
> - Headline: "Shop groceries online without reading every label."
> - Subhead: "SafeSnack flags your allergens in real time on Amazon Fresh."
> - CTA: "Get started →"
>
> **Step 2 — Pick your allergens**
> - Grid of 10 toggleable chips (one per allergen from `ALL_ALLERGENS`).
> - Each chip shows the allergen label and a subtle icon.
> - Large, touch-friendly, `role="checkbox"`, keyboard navigable.
> - Footer note: "You can change these anytime from the extension icon."
> - Requires ≥ 1 selected to proceed.
>
> **Step 3 — Try it**
> - Confirmation: "You're protected for: Milk, Peanut, Sesame"
> - CTA: "Shop Amazon Fresh →" (opens `https://www.amazon.com/alm/storefront?almBrandId=QW1hem9uIEZyZXNo` in new tab)
> - Secondary link: "See how it works" (links to landing page)
> - "Always verify packaging" disclaimer at the bottom.
>
> On completion: `saveSettings({ onboardingCompleted: true, allergens: [...] })`.
>
> Use Tailwind, keep the total bundle under 150KB. No animation libs; just CSS transitions.
>
> **Acceptance criteria:**
> - [ ] All 3 steps work end-to-end.
> - [ ] Selected allergens persist to `chrome.storage.sync`.
> - [ ] Keyboard-only navigation works.
> - [ ] Lighthouse accessibility score ≥ 95 on the onboarding page.
>
> **Commit:** `feat(onboarding): 3-step first-run flow`

---

### Task 5.2 — Popup UI

> **Prompt:**
> Implement `apps/extension/src/popup/App.tsx`.
>
> Layout (360×480px):
> - **Header:** "SafeSnack" + version badge
> - **Profile summary card:** "Protecting for: [Milk, Peanut, Sesame]" with "Edit" button
> - **Allergen editor (collapsible):** same 10 chips as onboarding; changes save instantly
> - **Activity:** "Products scanned today: N" (reads from session counter in `chrome.storage.session`)
> - **"Help us" stat:** "N products submitted" (from submissions queue)
> - **Footer:**
>   - "Always verify packaging" disclaimer
>   - Links: Feedback (mailto), Privacy, Rate on Web Store
>
> Tech:
> - Zustand store `popup/store.ts` that mirrors settings + subscribes via `subscribeToSettings`.
> - All writes go through `saveSettings`.
>
> **Acceptance criteria:**
> - [ ] Toggling an allergen updates badges on the open Amazon tab within 2 seconds.
> - [ ] Popup opens in < 300ms (no loading spinners needed).
> - [ ] Works offline (no network calls).
>
> **Commit:** `feat(popup): settings UI`

---

### Task 5.3 — Session counters + analytics

> **Prompt:**
> Create `apps/extension/src/services/analytics.ts` with privacy-respecting, opt-in analytics.
>
> MVP behavior:
> - **Local-only counters** in `chrome.storage.session` (cleared on browser restart):
>   - `scansToday`
>   - `unsafeShown`
>   - `submissionsThisSession`
> - `trackEvent(event: string, props?: Record<string, string|number>)` → for MVP, only writes to local counters; no external send.
> - v2 hook: if PostHog is enabled in `env.ts` and user opted in during onboarding, send anonymous events via `fetch` to PostHog `capture` endpoint. For MVP, leave opt-in default OFF and DO NOT make any external analytics calls.
>
> Events to instrument:
> - `extension_installed`
> - `onboarding_completed` (with allergen count)
> - `product_scanned` (state: safe/unsafe/unknown)
> - `pdp_viewed`
> - `submission_created`
>
> **Acceptance criteria:**
> - [ ] No external network calls in MVP build (verify in DevTools Network).
> - [ ] Counters increment and display in popup.
>
> **Commit:** `feat(extension): local-first analytics scaffolding`

---

## Phase 6 — Landing Page & Legal (Days 20–22)

### Task 6.1 — Scaffold Next.js landing

> **Prompt:**
> In `apps/web/`, scaffold a Next.js 14 App Router project.
>
> Deps: `next`, `react`, `react-dom`, `tailwindcss`, `lucide-react` (icons), `@vercel/analytics`.
>
> Routes:
> - `/` — marketing landing
> - `/privacy` — privacy policy
> - `/terms` — terms of service
> - `/install` — redirect to Chrome Web Store listing (once published); pre-publish, show "Opening soon" with email capture
>
> Theming: off-white background, green accent (`#16a34a`), system font stack.
>
> **Acceptance criteria:**
> - [ ] `pnpm --filter web dev` serves localhost:3000.
> - [ ] All 4 routes render.
> - [ ] Deployable to Vercel via `pnpm --filter web build`.
>
> **Commit:** `feat(web): scaffold Next.js landing`

---

### Task 6.2 — Landing copy & sections

> **Prompt:**
> Build `app/page.tsx` with these sections, in order:
>
> 1. **Hero**
>    - H1: "Shop groceries online without reading every label."
>    - Sub: "SafeSnack flags your allergens on Amazon Fresh, instantly. Free for your family."
>    - CTA: "Add to Chrome — free" → `/install`
>    - Trust line: "Works on Amazon Fresh today. Instacart and Walmart coming soon."
>    - Hero image: mock screenshot of an Amazon search with red/green badges overlaid (use a placeholder image `/hero.png` for now).
>
> 2. **How it works** (3-step)
>    - Pick your allergens (30 sec setup)
>    - Shop Amazon Fresh normally
>    - See red/green badges on every product
>
> 3. **Why SafeSnack**
>    - "Built for families with food allergies"
>    - "Detects 10 major allergens including sesame"
>    - "Always-verify disclaimer — never claims to replace reading labels"
>    - "Your data stays on your device" (privacy-first)
>
> 4. **FAQ** (accordion, 8 Qs)
>    - Is SafeSnack free? / What grocery sites are supported? / How accurate is it? / Is my data shared? / Does it work on mobile? / What if a product has no ingredients? / Who built this? / How is this different from Yuka?
>
> 5. **Footer**
>    - Links: Privacy, Terms, Contact (mailto), GitHub (if you go public)
>    - Disclaimer: "SafeSnack is a convenience tool, not a medical device. Always verify ingredients on product packaging."
>
> All copy must match Product Principles in PRD §5.
>
> **Acceptance criteria:**
> - [ ] Responsive on mobile, tablet, desktop.
> - [ ] Lighthouse score ≥ 95 Performance, ≥ 95 Accessibility.
> - [ ] No broken links.
>
> **Commit:** `feat(web): landing page content`

---

### Task 6.3 — Privacy policy & ToS

> **Prompt:**
> Generate a Privacy Policy and Terms of Service using [Termly](https://termly.io) (free tier) or write from scratch based on these requirements.
>
> **Privacy Policy must state:**
> - What is collected: allergen preferences (local), email (only if user creates account in v2), anonymized usage counters (local only in MVP)
> - What is NOT collected: browsing history, purchase data, PII, health data beyond declared allergens
> - Third parties: Open Food Facts (product lookups only, no user ID sent), no analytics in MVP
> - Data retention: all data local to user's browser; clearing extension data clears everything
> - User rights: GDPR + CCPA language
> - Contact: privacy@safesnack.co
>
> **Terms of Service must state (in bold at top):**
> > "SafeSnack is a convenience tool, not a medical device. Always verify ingredients on product packaging. We are not liable for missed allergens, allergic reactions, or any health-related outcomes."
>
> Plus standard ToS: use license, prohibited use, no warranty, limitation of liability ($0 cap or max amount paid in last 12 months), governing law, termination, changes to terms.
>
> Render both at `/privacy` and `/terms` using a shared `LegalLayout` component with a last-updated date.
>
> **Acceptance criteria:**
> - [ ] Both pages live and readable.
> - [ ] Disclaimer is visually prominent on `/terms` (bold banner at top).
> - [ ] Linked from extension popup + onboarding + landing footer.
>
> **Commit:** `feat(web): privacy policy and terms of service`

---

### Task 6.4 — Email capture

> **Prompt:**
> Add an email capture form on the landing page hero and `/install` page. For MVP, wire it to a **Google Form** (create one with a single email field) or a simple Airtable form — both are free and require no backend.
>
> Alternative: integrate a lightweight service (Loops.so free tier, ConvertKit free tier) if you plan email sequences later.
>
> On submit: show "Thanks — we'll email you when SafeSnack is ready." Do not block install CTA.
>
> **Acceptance criteria:**
> - [ ] Form submits without page reload.
> - [ ] Confirmation message shown.
> - [ ] Entries visible in Google Form/Airtable admin.
>
> **Commit:** `feat(web): email capture form`

---

## Phase 7 — QA & Beta Prep (Days 23–26)

### Task 7.1 — Manual QA test matrix

> **Prompt:**
> Create `docs/QA_MATRIX.md` listing 40 real Amazon Fresh product URLs covering:
> - 10 known-unsafe products for each common allergen (milk, peanut, wheat, sesame)
> - 10 known-safe products
> - 10 ambiguous / edge cases (e.g., "dairy-free" products, products with "may contain" labels, products with no ingredient section)
> - 5 non-food products (should be Unknown or ignored)
> - 5 seasonal/limited products (may have broken selectors)
>
> For each: record actual badge state, accuracy, false positive/negative. Iterate on detector + selectors until ≥ 90% accuracy on this matrix.
>
> Goal: **0 false-positive Safe badges** on products that actually contain target allergens. False Unknowns are acceptable; false Safes are not.
>
> **Acceptance criteria:**
> - [ ] Matrix documented.
> - [ ] ≥ 90% overall accuracy.
> - [ ] 100% recall on unsafe products (no false Safes).
>
> **Commit:** `docs(qa): Amazon Fresh detection matrix + fixes`

---

### Task 7.2 — Error monitoring

> **Prompt:**
> Integrate Sentry (free tier, `@sentry/browser`) in the extension background + content scripts.
>
> - Init with environment and release version from `manifest.json`.
> - Scrub PII: never send URL query strings, form data, or DOM text content.
> - Sampling: 100% errors, 10% transactions.
> - Add `beforeSend` that drops events matching known-safe Amazon DOM errors.
> - Store DSN in `apps/extension/src/env.ts`, sourced from `.env` at build time via Vite define.
>
> **Acceptance criteria:**
> - [ ] Throwing a test error in background shows up in Sentry.
> - [ ] No DOM text content leaks in events.
>
> **Commit:** `feat(extension): Sentry error monitoring`

---

### Task 7.3 — Beta build & distribution

> **Prompt:**
> Produce a reproducible beta build:
> - `pnpm --filter extension build` → `apps/extension/dist/`
> - Zip to `safesnack-beta-v0.1.0.zip`
> - Create `docs/BETA_USER_GUIDE.md` with:
>   - How to load unpacked extension in Chrome
>   - What sites it works on
>   - Known limitations
>   - How to report bugs (email + short Google Form)
>   - Explicit disclaimer
>
> **Acceptance criteria:**
> - [ ] Zip file builds clean.
> - [ ] Guide tested by loading on a fresh Chrome profile.
>
> **Commit:** `chore(release): beta v0.1.0 build + guide`

---

## Phase 8 — Chrome Web Store Submission (Days 27–30)

### Task 8.1 — Web Store assets

> **Prompt:**
> Produce the following assets for the Chrome Web Store listing:
>
> - **Icon:** 128×128 PNG, rounded-square safe zone. Design: green shield + leaf mark + "S" letterform. Export also at 48, 32, 16.
> - **Screenshots:** 5 at 1280×800, showing:
>   1. Onboarding step 2 (allergen picker)
>   2. Amazon search page with badges (real)
>   3. Amazon PDP with highlighted ingredients
>   4. Popup settings
>   5. "Help us" submission modal
> - **Small promo tile:** 440×280 PNG
> - **Marquee promo tile:** 1400×560 PNG (optional, improves placement)
> - **Listing copy:**
>   - Short description (132 chars max): `"Flag your food allergens on Amazon Fresh. Red/green badges on every product. Free. Privacy-first."`
>   - Detailed description (16,000 chars max): 3-part structure — problem, how it works, trust/disclaimer. End with "always verify packaging" line.
> - **Category:** Shopping
> - **Language:** English (US)
>
> Save all to `apps/extension/store-assets/`.
>
> **Acceptance criteria:**
> - [ ] All image assets meet size and format requirements.
> - [ ] Copy reviewed for any medical claims (must have none).
>
> **Commit:** `feat(store): Chrome Web Store listing assets`

---

### Task 8.2 — Privacy disclosures form prep

> **Prompt:**
> Prepare answers for the Chrome Web Store privacy disclosure form:
>
> - **Single purpose:** "Flag food allergens on online grocery product pages."
> - **Permission justifications:**
>   - `storage`: "Save user's allergen profile locally."
>   - `activeTab`: "Read product ingredient data on the grocery page the user is viewing."
>   - Host permissions for openfoodfacts.org + USDA: "Look up ingredient data for products that don't list them in DOM."
> - **Data usage disclosure:** declare NO collection of:
>   - Personally identifiable information
>   - Health information
>   - Financial information
>   - Authentication information
>   - Personal communications
>   - Location
>   - Web history
>   - User activity
>   - Website content
> - **Compliance certifications:** Check "I do not sell or transfer user data to third parties outside of the approved use cases" and "I do not use or transfer user data for purposes unrelated to my item's single purpose."
>
> Save to `docs/CHROME_STORE_SUBMISSION.md`.
>
> **Acceptance criteria:**
> - [ ] Document complete and consistent with privacy policy.
>
> **Commit:** `docs(store): privacy disclosure answers`

---

### Task 8.3 — Submit to Chrome Web Store

> **Prompt:**
> Register the Chrome Web Store developer account ($5 one-time) at https://chrome.google.com/webstore/devconsole.
>
> Create a new item, upload the zip from Task 7.3, fill in all fields using assets from 8.1 and answers from 8.2.
>
> - Distribution: Public (or Unlisted for first 100 users if you prefer a soft launch).
> - Pricing: Free.
> - Regions: United States (add Canada, UK, Australia if ready).
>
> Submit for review.
>
> Expected review window: 3–14 days.
>
> **Acceptance criteria:**
> - [ ] Submission confirmed by Google.
> - [ ] Screenshot of dashboard saved to repo.
>
> **Commit:** `chore(release): submit v0.1.0 to Chrome Web Store`

---

## Conventions

### Commit messages
Conventional Commits:
- `feat(scope): …` new feature
- `fix(scope): …` bug fix
- `chore(scope): …` tooling, deps, release
- `docs(scope): …` docs only
- `test(scope): …` test-only change
- `refactor(scope): …` non-behavioral change

Scopes used: `engine`, `extension`, `content`, `background`, `popup`, `onboarding`, `web`, `store`, `qa`, `services`, `shared-types`.

### Branching
- Trunk-based, direct commits to `main` acceptable for solo founder in MVP phase.
- Tag releases: `v0.1.0`, `v0.1.1`, etc.

### Definition of Done (per task)
1. All acceptance criteria met.
2. Typecheck + lint + tests pass locally.
3. CI green on the commit.
4. Manual smoke test on a real Amazon Fresh page (for extension tasks).
5. Committed with the specified message.

### Definition of Done (for MVP)
1. All 8 phases complete.
2. 40-item QA matrix passes ≥ 90% with 0 false Safes.
3. 10 real beta users installed via unpacked or Web Store listing.
4. Privacy policy + terms live on safesnack.co.
5. At least 1 "I would pay for this" quote from a beta user.

### What to do when a task blocks
- Selector rot / Amazon DOM changes → extend `AMAZON_SELECTORS` arrays, never hard-code.
- Open Food Facts miss rate > 30% → prioritize Task 4.2 (user submissions) + consider USDA integration earlier.
- Detector false positives > 5% → extend synonym `ambiguous` lists, not main aliases.
- Chrome Web Store rejection → read rejection reason verbatim, fix, resubmit. Common: permission justifications too vague, privacy policy mismatch.

### What NOT to build in MVP (reminder)
- Accounts, auth, cloud sync
- Stripe, paid tiers
- Instacart, Walmart support
- Family profiles
- Recall alerts
- Mobile
- Custom non-allergen avoid-lists
- LLM fallback in detection engine (heuristic-only for MVP; add in v2)

---

## Execution Log Template

> Copy this into `docs/EXECUTION_LOG.md` and update after each task.

```
## Task 0.1 — Initialize the monorepo
Status: [ ] not-started [ ] in-progress [x] done
Started: YYYY-MM-DD
Finished: YYYY-MM-DD
Notes: (any deviations, blockers, learnings)
Commit SHA: abc123
```

---

**Start with Task 0.1. Do not read ahead. Complete one task at a time, green CI, commit, move on.**
