# Chrome Web Store — privacy disclosure (draft answers)

Use this text in the Chrome Web Store Developer Dashboard **Privacy practices** section. Keep in sync with `apps/extension/manifest.config.ts` and `https://safesnack.co/privacy`.

**Privacy policy URL:** `https://safesnack.co/privacy`

**Last reviewed against manifest:** extension `manifest.config.ts` (permissions + `host_permissions` as shipped in-repo).

---

## Single purpose description

> Flag food allergens on online grocery product pages.

---

## Permission justifications

Paste each line next to the corresponding permission in the dashboard.

| Permission    | Justification                                                                                                                                                                                       |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **storage**   | Save the user's allergen profile and extension settings locally (Chrome `sync` / `local` storage as implemented). Cache recent public ingredient lookups locally to reduce repeat network requests. |
| **activeTab** | When the user is on a supported grocery page, access the visible tab context needed to read on-page product and ingredient information for allergen matching.                                       |
| **tabs**      | Open onboarding after install and broadcast updated settings to open browser tabs so content scripts can refresh badges without a full page reload.                                                 |
| **alarms**    | Run a periodic task to clear expired local ingredient-cache entries.                                                                                                                                |

---

## Host permission justifications

Declared in manifest:

- `https://world.openfoodfacts.org/*`
- `https://api.nal.usda.gov/*`

**Justification (combined):**

> Look up public ingredient data for products when the grocery page does not expose enough ingredient text in the DOM, using only the minimum product-identifying fields needed for the lookup. Requests do not attach a SafeSnack account ID, email, or name in the MVP (see privacy policy).

---

## Data usage — categories SafeSnack does **not** collect

In the dashboard, answer **No** / do **not** declare collection for the categories below **as data collected by SafeSnack (the developer) or sent to SafeSnack-operated servers**. Processing on the user’s device for the single purpose above is not remote collection.

Aligns with **What we do not collect (MVP)** and related sections in `apps/web/app/privacy/page.tsx`.

| Category                            | Disclosure intent                                                                                                                                                                                                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Personally identifiable information | **No** — MVP core features do not collect name, email, phone, or postal address on SafeSnack servers.                                                                                                                                                               |
| Health information                  | **No** — SafeSnack does not operate a remote health record; allergen flags chosen in the extension are stored with Chrome’s storage APIs on the user’s device for MVP-only local features (see privacy policy wording on allergen preferences vs. medical records). |
| Financial information               | **No** — no payment or order data collection in MVP.                                                                                                                                                                                                                |
| Authentication information          | **No** — no login for MVP core flow.                                                                                                                                                                                                                                |
| Personal communications             | **No** — not read or collected.                                                                                                                                                                                                                                     |
| Location                            | **No** — not collected.                                                                                                                                                                                                                                             |
| Web history                         | **No** — no developer-side history of arbitrary browsing; extension runs on declared grocery host patterns only.                                                                                                                                                    |
| User activity                       | **No** — session counters (e.g. scans today) stay in local/session storage in the MVP build and are not sent to third-party analytics products as described in the privacy policy.                                                                                  |
| Website content                     | **No** — grocery page HTML is not uploaded to SafeSnack-operated servers. Ingredient-related text may be analyzed locally; optional public API calls use limited product fields per the privacy policy (Open Food Facts / USDA API hosts in manifest).              |

If the form separates “remote vs. on-device” differently, prefer answers that match **no remote collection by the developer** and cite the privacy policy.

---

## Compliance certifications (checklist)

In **Compliance certifications**, select:

- [x] **I do not sell or transfer user data to third parties outside of the approved use cases.**
- [x] **I do not use or transfer user data for purposes unrelated to my item’s single purpose.**

---

## Optional notes for reviewers

- Third-party **Open Food Facts** / **USDA** endpoints receive only what is necessary for public product/ingredient lookup, without attaching a persistent SafeSnack user identifier in the MVP (privacy policy § Third parties).
- Remote error monitoring (e.g. Sentry), if enabled in a given build, should be disclosed separately if it processes personal data; keep this document updated if that changes.
