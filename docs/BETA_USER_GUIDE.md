# SafeSnack beta (v0.1.0) — user guide

This guide matches the **beta v0.1.0** build produced from this repo (`manifest` version `0.1.0`). For a reproducible zip:

```bash
pnpm beta:zip
```

That runs `pnpm --filter @safesnack/extension build` (package name in this monorepo) and writes `safesnack-beta-v0.1.0.zip` at the **repository root** (zip root = contents of `apps/extension/dist/`, including `manifest.json`).

> **Note:** `pnpm --filter extension build` only works if your workspace exposes that short name; here use `@safesnack/extension` or the `pnpm beta:zip` shortcut above.

---

## 1. Load the unpacked extension in Chrome (recommended: fresh profile)

### Option A — Fresh Chrome profile (best for testing)

1. Open Chrome → **Settings** → **You and Google** → **Add** (or **Manage Chrome profiles** → **Add**).
2. Name the profile (e.g. `SafeSnack beta`) and finish setup.
3. In that profile, go to `chrome://extensions/`.
4. Turn **Developer mode** on (top right).
5. If you have a **zip**: unzip `safesnack-beta-v0.1.0.zip` to a folder (e.g. `~/Downloads/safesnack-beta-v0.1.0/`). You should see `manifest.json` at the **top level** of that folder.
6. Click **Load unpacked** and select that folder (the directory that contains `manifest.json`, not the zip).

### Option B — Existing profile

Same as steps 3–6 above. Other extensions may interact with Amazon pages; use a fresh profile if something looks wrong.

### After install

- Complete onboarding (pick allergens).
- Open **Amazon** (see below) and confirm badges appear on search tiles or PDP when ingredient data is available.

---

## 2. What sites it works on

| Site / URL                         | Support in v0.1.0                                                                                                      |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `https://www.amazon.com/*`         | **Yes** — content script is scoped here. Amazon Fresh flows that use this host (including `/alm/` paths) are in scope. |
| Instacart, Walmart Grocery, Kroger | **No** — roadmap only.                                                                                                 |
| Mobile Safari / iOS                | **No** — desktop **Chrome** + MV3 extension only.                                                                      |

The extension does **not** use `<all_urls>` for its main script; grocery pages outside `www.amazon.com` are unchanged.

---

## 3. Known limitations (v0.1.0)

- **Amazon retail host only** — not other TLDs unless you sideload a fork with different `matches`.
- **Badge quality depends on ingredient text** — missing or odd DOM → **Unknown** is normal; that is safer than a false green “safe.”
- **“May contain” / facility lines** — shown cautiously; green **Safe** is not used when only may-contain matches your profile (see product docs).
- **No account / cloud sync** — settings stay in Chrome (`chrome.storage.sync` where available).
- **No cart-level summary** in this beta.
- **Sentry** (if enabled in your build) scrubs query strings and avoids default PII; still avoid pasting secrets into bug reports.

---

## 4. How to report bugs

1. **Email (fastest):** [hello@safesnack.co](mailto:hello@safesnack.co?subject=SafeSnack%20beta%20feedback)  
   Include: Chrome version, OS, URL (path is fine; you can strip query if you prefer), what you expected vs what happened, and a screenshot if helpful.

2. **Short Google Form (optional):** Before wide beta, maintainers publish a 1-field (or few-field) form for structured feedback. **Placeholder until published:** replace the link below with your live form URL.

   **Form:** _[Paste Google Form URL here before sending zip to testers]_

---

## 5. Disclaimer (read this)

**SafeSnack is a convenience tool, not a medical device. Always verify ingredients on product packaging.** The extension can be wrong when ingredient data is incomplete, stale, or misread from the page. We are not liable for missed allergens, reactions, or any health outcome. If you have a medical emergency, call your local emergency number.

---

## 6. Rebuild from source (trust but verify)

```bash
git checkout <tag-or-commit>
pnpm install
pnpm beta:zip
```

Compare `manifest.json` inside the zip with what you expect (`name`, `version`, `permissions`).
