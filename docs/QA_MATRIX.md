# SafeSnack — Amazon Fresh / Amazon grocery QA matrix

**Purpose:** Manual + automated gate for search-tile and PDP badges. **Hard rule:** never show a green **Safe** badge when the user’s profile allergen is only supported by “may contain” / facility language, or when ingredient text is missing or low-confidence.

**ASIN hygiene:** Amazon merges and retires SKUs. If a PDP no longer matches the **Engine snippet** column, swap the URL and record the change in `docs/SELECTOR_CHANGES.md`.

**Engine fixtures:** `packages/allergen-engine/src/qa-matrix.test.ts` mirrors the `Engine snippet` column. Run:

```bash
pnpm --filter @safesnack/allergen-engine test
```

**Latest engine run (CI):** 40/40 fixture expectations pass; **100%** of `Known-unsafe` rows → `Unsafe`; overall fixture accuracy **100%** (≥ 90% gate). Unsafe recall gate: **no false Safe** on declared contains-ingredient cases in the matrix.

**How to audit a row**

1. Install the extension; set profile to **Test profile (allergens)**.
2. Open the PDP URL on `amazon.com` (Fresh or retail grocery PDP with same ASIN when applicable).
3. Record **Actual badge** on tile (search) or PDP banner (PDP): `Safe` / `Unsafe` / `Unknown`.
4. **False Safe** = actual `Safe` when **Expected (minimum)** requires `Unsafe` or `Not Safe` (i.e. must not be green Safe). **False Unsafe** = actual `Unsafe` when expected **Not Unsafe** or `Unknown` only.

**Expected (minimum) legend**

| Expected     | Meaning                                                                                      |
| ------------ | -------------------------------------------------------------------------------------------- |
| `Unsafe`     | Declared contains / primary-zone hit for profile → must be red.                              |
| `Not Unsafe` | Must **not** be red `Unsafe`; `Unknown` or cautious non-green is OK.                         |
| `Unknown`    | Should be amber `Unknown` (missing text, may-contain-only for profile, ambiguous, non-food). |

---

## Summary (fill after manual pass)

| Metric                        | Target | Last manual audit |
| ----------------------------- | ------ | ----------------- |
| Overall accuracy              | ≥ 90%  | _TBD_             |
| Unsafe recall (no false Safe) | 100%   | _TBD_             |
| Auditor                       | —      |                   |
| Extension version             | —      |                   |

---

## Matrix (40 rows)

Columns **Actual** / **Match** / **FP / FN** are for human QA; keep in sync after detector or selector changes.

| ID   | Amazon PDP URL                       | Bucket       | Test profile (allergens) | Expected (minimum) | Engine snippet (fixture `id`)                           | Actual (audit) | Match | FP / FN | Notes                                                                      |
| ---- | ------------------------------------ | ------------ | ------------------------ | ------------------ | ------------------------------------------------------- | -------------- | ----- | ------- | -------------------------------------------------------------------------- |
| U-01 | https://www.amazon.com/dp/B000SKM8LQ | Known-unsafe | milk                     | Unsafe             | `Organic grade a milk, vitamin d3.`                     |                |       |         | Horizon-style milk PDP.                                                    |
| U-02 | https://www.amazon.com/dp/B000YMZUR2 | Known-unsafe | milk                     | Unsafe             | `Lowfat milk, vitamin a palmitate, vitamin d3.`         |                |       |         | Half-gallon milk line; confirm on-label milk.                              |
| U-03 | https://www.amazon.com/dp/B000SKPJSU | Known-unsafe | milk                     | Unsafe             | `Skim milk, vitamin a palmitate, vitamin d3.`           |                |       |         | Reduced-fat / dairy SKU — verify milk on label.                            |
| U-04 | https://www.amazon.com/dp/B000R2Z2S6 | Known-unsafe | peanut                   | Unsafe             | `Roasted peanuts, sugar, salt.`                         |                |       |         | Jif-style peanut butter.                                                   |
| U-05 | https://www.amazon.com/dp/B00PJCYOWE | Known-unsafe | peanut                   | Unsafe             | `Peanut butter.`                                        |                |       |         | Multi-pack Jif listing.                                                    |
| U-06 | https://www.amazon.com/dp/B0045TQLEG | Known-unsafe | peanut                   | Unsafe             | `Peanuts, salt, molasses.`                              |                |       |         | Uppercase ASIN on site may vary; use canonical PDP.                        |
| U-07 | https://www.amazon.com/dp/B000G0K112 | Known-unsafe | wheat                    | Unsafe             | `Semolina, durum wheat flour, niacin.`                  |                |       |         | Barilla-style semolina pasta.                                              |
| U-08 | https://www.amazon.com/dp/B00WBGKJPW | Known-unsafe | wheat                    | Unsafe             | `Whole wheat flour, water.`                             |                |       |         | Whole-wheat pasta variant.                                                 |
| U-09 | https://www.amazon.com/dp/B000VK484I | Known-unsafe | sesame                   | Unsafe             | `Sesame seeds, salt.`                                   |                |       |         | Joyva tahini / sesame SKU.                                                 |
| U-10 | https://www.amazon.com/dp/B00ZGT5XJ8 | Known-unsafe | sesame                   | Unsafe             | `Tahini (ground sesame seeds).`                         |                |       |         | Multi-pack tahini.                                                         |
| S-01 | https://www.amazon.com/dp/B003QX2Q3U | Known-safe\* | milk                     | Not Unsafe         | `Water, carbon dioxide.`                                |                |       |         | Sparkling water–style; confirm no dairy.                                   |
| S-02 | https://www.amazon.com/dp/B000UX0SYS | Known-safe\* | milk                     | Not Unsafe         | `Tomatoes, salt, citric acid.`                          |                |       |         | Canned tomatoes.                                                           |
| S-03 | https://www.amazon.com/dp/B000R4DFNK | Known-safe\* | peanut                   | Not Unsafe         | `Black beans, water, salt.`                             |                |       |         | Canned beans.                                                              |
| S-04 | https://www.amazon.com/dp/B004GW14R6 | Known-safe\* | wheat                    | Not Unsafe         | `Green beans, water.`                                   |                |       |         | Canned veg; confirm no gluten thickeners.                                  |
| S-05 | https://www.amazon.com/dp/B000ETKLKS | Known-safe\* | sesame                   | Not Unsafe         | `100% apple juice.`                                     |                |       |         | Shelf-stable juice.                                                        |
| S-06 | https://www.amazon.com/dp/B00CHUG2N0 | Known-safe\* | milk                     | Not Unsafe         | `Carrots.`                                              |                |       |         | Frozen or canned carrots — verify label.                                   |
| S-07 | https://www.amazon.com/dp/B000Q5D7F0 | Known-safe\* | wheat                    | Not Unsafe         | `Rice, water.`                                          |                |       |         | Rice side; confirm no malt flavoring.                                      |
| S-08 | https://www.amazon.com/dp/B000RUPH9K | Known-safe\* | soy                      | Not Unsafe         | `Olive oil.`                                            |                |       |         | Single-ingredient oil.                                                     |
| S-09 | https://www.amazon.com/dp/B000WA6KFK | Known-safe\* | fish                     | Not Unsafe         | `Salt, black pepper.`                                   |                |       |         | Spices only.                                                               |
| S-10 | https://www.amazon.com/dp/B001SAZEXA | Known-safe\* | egg                      | Not Unsafe         | `Distilled vinegar, water.`                             |                |       |         | Vinegar; confirm no egg in brand.                                          |
| A-01 | https://www.amazon.com/dp/B085D67F99 | Ambiguous    | milk                     | Unknown            | `Sugar. May contain milk.`                              |                |       |         | Pick SKU with explicit may-contain dairy; swap ASIN if label differs.      |
| A-02 | https://www.amazon.com/dp/B07YFM7JK6 | Ambiguous    | peanut                   | Unknown            | `Sugar. May contain peanuts.`                           |                |       |         | Use chocolate/snack with may-contain peanuts when found.                   |
| A-03 | https://www.amazon.com/dp/B07FQW11X2 | Ambiguous    | peanut                   | Not Unsafe         | `Coconut cream, pea protein. May contain tree nuts.`    |                |       |         | Dairy-free dessert; tree-nut may line — not peanut contains.               |
| A-04 | https://www.amazon.com/dp/B00JJPMXDO | Ambiguous    | milk                     | Not Unsafe         | `Natural flavors.`                                      |                |       |         | Ambiguous base; expect Unknown or Not Unsafe, never Safe without evidence. |
| A-05 | https://www.amazon.com/dp/B000HJBKMQ | Ambiguous    | soy                      | Unknown            | `Lecithin.`                                             |                |       |         | Ambiguous lecithin → low confidence.                                       |
| A-06 | https://www.amazon.com/dp/B00T7QDGCO | Ambiguous    | wheat                    | Unknown            | `Processed in a facility that processes wheat.`         |                |       |         | Pick PDP whose label includes facility wheat; rotate ASIN if needed.       |
| A-07 | https://www.amazon.com/dp/B0014D2DKC | Ambiguous    | milk                     | Not Unsafe         | `Almonds, sea salt.`                                    |                |       |         | Tree nuts only; milk profile should not go Unsafe.                         |
| A-08 | https://www.amazon.com/dp/B000SKM8LQ | Ambiguous    | sesame                   | Not Unsafe         | `Skim milk, vitamin a palmitate.`                       |                |       |         | Milk present but sesame profile — not Unsafe for sesame.                   |
| A-09 | https://www.amazon.com/dp/B0743LKHXN | Ambiguous    | milk                     | Not Unsafe         | `Dairy-free blend (coconut oil, modified food starch).` |                |       |         | Marketing “dairy-free”; read full ingredients for casein edge cases.       |
| A-10 | https://www.amazon.com/dp/B003V4DJIE | Ambiguous    | milk                     | Not Unsafe         | `Enriched flour (wheat flour, niacin).`                 |                |       |         | Wheat cracker; milk profile — must not be Unsafe for milk.                 |
| N-01 | https://www.amazon.com/dp/B005GI8UOO | Non-food     | milk                     | Unknown            | _(no ingredient text)_                                  |                |       |         | Laundry detergent — ignore or Unknown.                                     |
| N-02 | https://www.amazon.com/dp/B004Q3RODM | Non-food     | peanut                   | Unknown            | _(no ingredient text)_                                  |                |       |         | Dishwasher gel.                                                            |
| N-03 | https://www.amazon.com/dp/B000TTJ9Q2 | Non-food     | wheat                    | Unknown            | _(no ingredient text)_                                  |                |       |         | Surface cleaner.                                                           |
| N-04 | https://www.amazon.com/dp/B0037H3EB0 | Non-food     | sesame                   | Unknown            | _(no ingredient text)_                                  |                |       |         | Storage bags.                                                              |
| N-05 | https://www.amazon.com/dp/B00Q70CXG1 | Non-food     | egg                      | Unknown            | _(no ingredient text)_                                  |                |       |         | Disinfecting wipes.                                                        |
| Q-01 | https://www.amazon.com/dp/B000Z61VFQ | Seasonal     | milk                     | Unknown            | _(placeholder — brittle markup / rotate SKU)_           |                |       |         | Seasonal candy; re-validate yearly.                                        |
| Q-02 | https://www.amazon.com/dp/B0040QCY3C | Seasonal     | milk                     | Unknown            | _(placeholder)_                                         |                |       |         | Seasonal chocolate egg.                                                    |
| Q-03 | https://www.amazon.com/dp/B00BN0N254 | Seasonal     | wheat                    | Unknown            | _(placeholder)_                                         |                |       |         | Seasonal mix; watch for bundle PDP changes.                                |
| Q-04 | https://www.amazon.com/dp/B000JGZLFE | Seasonal     | peanut                   | Unknown            | _(placeholder)_                                         |                |       |         | Seasonal nog / limited run.                                                |
| Q-05 | https://www.amazon.com/dp/B07C7WB8H2 | Seasonal     | sesame                   | Unknown            | _(placeholder)_                                         |                |       |         | Limited seasonal SKU.                                                      |

\*“Known-safe” here means **expected not Unsafe** for the listed profile once label is confirmed; **Unknown** is acceptable per product principles.

---

## Selector / DOM follow-ups

- If **Actual** diverges from **Expected** but the engine fixture passes, treat as **selector / PDP parse** issue: extend `apps/extension/src/content/selectors/amazon.ts` and log the change in `docs/SELECTOR_CHANGES.md`.
- If divergence matches a bad **engine** outcome, fix `packages/allergen-engine` and extend `detect.test.ts` / `qa-matrix.test.ts`.

---

## Changelog

| Date       | Change                                                                   |
| ---------- | ------------------------------------------------------------------------ |
| 2026-04-21 | Initial matrix + `badgeStateFromDetection` may-contain → not Safe green. |
