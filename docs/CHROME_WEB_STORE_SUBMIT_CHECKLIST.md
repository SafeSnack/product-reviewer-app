# Task 8.3 — Chrome Web Store submission (operator checklist)

**Agent cannot complete:** Google sign-in, $5 registration payment, zip upload in Dev Console, or review submission. Owner completes steps below; expected review **3–14 days** after **Submit for review**.

## Prereqs

1. **Developer registration:** one-time fee (currently $5) at [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. **Reproducible zip (Task 7.3):** from repo root:

   ```bash
   pnpm beta:zip
   ```

   Produces **`safesnack-beta-v0.1.0.zip`** at repository root (gitignored; rebuild any time).

3. **Privacy policy live:** `https://safesnack.co/privacy` (required for listing).

## New item — upload & package

1. Dev Console → **New item** → upload **`safesnack-beta-v0.1.0.zip`**.
2. **Manifest version** should read **0.1.0** (from `apps/extension/manifest.config.ts`).

## Store listing (Task 8.1 assets)

Path: `apps/extension/store-assets/`

| Field                | Source                                                      |
| -------------------- | ----------------------------------------------------------- |
| Icons                | `icon-16.png`, `icon-32.png`, `icon-48.png`, `icon-128.png` |
| Screenshots (5)      | `screenshot-01-…` through `screenshot-05-…` (1280×800)      |
| Small promo tile     | `promo-small-440x280.png`                                   |
| Marquee (optional)   | `promo-marquee-1400x560.png`                                |
| Short description    | `listing-short-description.txt`                             |
| Detailed description | `listing-detailed-description.txt`                          |
| Category             | **Shopping**                                                |
| Language             | **English (United States)**                                 |

## Privacy practices (Task 8.2)

Copy fields and tables from `docs/CHROME_STORE_SUBMISSION.md` (keep in sync with manifest + privacy policy).

## Distribution, pricing, regions

| Setting    | Value                                                                                                    |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| Visibility | **Public**, or **Unlisted** for soft launch (first testers)                                              |
| Pricing    | **Free**                                                                                                 |
| Regions    | Start **United States**; add **Canada**, **United Kingdom**, **Australia** when support/legal copy ready |

## After Google accepts / shows “Pending review” or “Published”

**Acceptance evidence for Task 8.3**

1. Confirm email / dashboard status from Google (**submission confirmed**).
2. Save a **full-window screenshot** of the Developer Dashboard item page (shows item ID, status, version).

   **Repo path (add this file in a follow-up commit):**

   `docs/chrome-webstore-dashboard-v0.1.0.png`

3. Suggested commit when screenshot exists:

   ```text
   chore(release): submit v0.1.0 to Chrome Web Store
   ```

   Include only the PNG (and optional short note in `docs/` if needed); avoid committing secrets or draft zips.

## Notes

- `web_accessible_resources` in manifest uses `<all_urls>` for onboarding assets; reviewers may ask—point to scoped content script hosts + least-privilege rationale in `SAFESNACK_PRD.md` / privacy doc if needed.
- Do not commit `.env`, API keys, or non-gitignored zip artifacts.
