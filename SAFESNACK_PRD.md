# SafeSnack — Product Requirements & Build Plan

> **Owner:** Sathvik
> **Domain:** safesnack.co
> **Status:** Pre-MVP, Day 0
> **Last updated:** April 2026
> **Document purpose:** Single source of truth for vision, scope, architecture, and execution. Read top-to-bottom before writing code.

---

## Table of Contents

1. [Vision & Positioning](#1-vision--positioning)
2. [Target Users & Personas](#2-target-users--personas)
3. [Problem Statement & Jobs-To-Be-Done](#3-problem-statement--jobs-to-be-done)
4. [Competitive Landscape](#4-competitive-landscape)
5. [Product Principles](#5-product-principles)
6. [Feature Inventory (v1 → v3)](#6-feature-inventory-v1--v3)
7. [MVP Definition & Scope](#7-mvp-definition--scope)
8. [User Flows](#8-user-flows)
9. [Tech Stack](#9-tech-stack)
10. [System Architecture](#10-system-architecture)
11. [Data Model](#11-data-model)
12. [Allergen Detection Engine](#12-allergen-detection-engine)
13. [Data Sources & Coverage Strategy](#13-data-sources--coverage-strategy)
14. [Pricing & Monetization](#14-pricing--monetization)
15. [Security, Privacy & Liability](#15-security-privacy--liability)
16. [Analytics & Success Metrics](#16-analytics--success-metrics)
17. [Go-To-Market Plan](#17-go-to-market-plan)
18. [Roadmap & Milestones](#18-roadmap--milestones)
19. [Risks & Mitigations](#19-risks--mitigations)
20. [Open Questions](#20-open-questions)
21. [Appendix: File/Folder Layout](#21-appendix-filefolder-layout)

---

## 1. Vision & Positioning

### Vision (3–5 yr)
> Make every online grocery purchase safe for people with food allergies and dietary restrictions, without forcing them to read a single ingredient label.

### One-line positioning
**SafeSnack is the Chrome extension that flags unsafe food in your online grocery cart — instantly, on every site, for your whole family.**

### Why now (April 2026)
- US online grocery is now ~30% of total grocery spend (post-COVID structural shift).
- Food allergy diagnoses up ~50% in kids over the past decade.
- LLM-based ingredient parsing is finally cheap (`gpt-4o-mini` ≈ $0.15/M tokens).
- Open Food Facts dataset crossed 3M products with US coverage finally usable.
- No incumbent owns the **desktop online grocery** experience. Yuka, Fig, Bobby Approved are all mobile-camera-first.

### Anti-vision (what we are NOT)
- Not a recipe app.
- Not a calorie tracker.
- Not a mobile barcode scanner.
- Not a medical/diagnostic tool.
- Not a social network for allergy parents.

---

## 2. Target Users & Personas

### Primary: "Allergy Mom Maya"
- 32–45, US suburban, household income $80–180K.
- 1+ child with diagnosed food allergy (peanut, tree nut, dairy, egg, sesame).
- Shops Amazon Fresh / Instacart / Walmart Grocery weekly.
- Currently spends 30–60 min reading ingredient lists per shop.
- Has had at least one "near miss" — bought something containing the allergen.
- **Willingness to pay: $5–10/mo without thinking.**
- Found via: Facebook groups ("Kids With Food Allergies"), r/FoodAllergies, allergist offices.

### Secondary: "Celiac Chris"
- 25–55, diagnosed Celiac or NCGS.
- Hyper-vigilant about gluten cross-contamination.
- Often vegan/vegetarian on top of gluten-free.
- Buys specialty brands; needs cross-reference checking.
- **WTP: $7–12/mo.**

### Tertiary: "Diet-Driven Dana"
- Keto / carnivore / Whole30 / low-FODMAP.
- Less emotional urgency, more "convenience and identity."
- High churn but cheap to acquire.
- **WTP: $4–6/mo.**

### Anti-persona (don't build for these)
- Casual "clean eating" curious shoppers — won't pay, will demand free forever.
- Restaurant patrons looking for menu help (different product, different distribution).
- B2B grocery chains — wrong sales motion for a solo founder.

---

## 3. Problem Statement & Jobs-To-Be-Done

### Problem
Online grocery shoppers with food allergies have to manually verify ingredients on every product, every shop. Existing tools are mobile-camera apps that don't work in browsers. Mistakes risk ER visits.

### JTBD Statements

| When… | I want to… | So I can… |
|---|---|---|
| I'm shopping Amazon Fresh for my peanut-allergic kid | instantly know which products are safe | trust my cart without reading 40 labels |
| I'm trying a new brand | see if it's safe before I add to cart | avoid wasting money on returns/ER trips |
| I check out | get a final summary of risky items | catch anything I missed |
| A new recall hits | be alerted if I bought it recently | throw it out before my kid eats it |
| My partner shops too | share my kid's allergen profile | get the same protection on their account |

---

## 4. Competitive Landscape

| Tool | Form | Strengths | Weaknesses | Threat |
|---|---|---|---|---|
| **Yuka** | Mobile barcode app | 40M users, brand trust | No browser/desktop, no online grocery | Low |
| **Fig** | Mobile app | Allergy-focused, good UX | Mobile only, weak data | Low |
| **Bobby Approved** | Mobile app | Strong creator following | One person's opinions, no allergens | Low |
| **Spokin** | Restaurant directory | Community reviews | Not a scanner | Low |
| **Instacart "free from" filter** | Native filter | Free, integrated | Inaccurate, only 4 categories, opt-in per search | Medium |
| **Amazon "dietary preferences"** | Native filter | Free, integrated | Coarse (gluten-free, kosher only), unreliable | Medium |
| **AllergyEats / Spoon Guru API** | B2B data licensing | Comprehensive ingredient DB | Not consumer-facing | Low — could license their data |
| **Generic ingredient parsers (ChatGPT)** | Manual | Free, flexible | High friction, no badges | Low |

**Our wedge:** Desktop-first, multi-site, family-shared, with the cleanest UX. The mobile incumbents will not build this because their distribution and revenue come from app store presence.

---

## 5. Product Principles

1. **Safety over slickness.** A false negative (missed allergen) is catastrophic. Always default to "Unknown" with a clear nudge to verify.
2. **Zero friction at the moment of need.** No login required to scan. Onboarding ≤ 60 seconds. Settings sync silently.
3. **Family is the unit, not the user.** Multiple profiles per account. Shared between partners.
4. **Honest about uncertainty.** "May contain" ≠ "contains" ≠ "free from." Show three states clearly.
5. **Buyer trust > growth hacks.** No dark patterns. No selling data. No ads on free tier ever.
6. **Ship boring, working features over flashy ones.** Badges that work on every Amazon page beat AI chat assistants.
7. **The community is the moat.** Users correct ingredients. Their corrections improve the product for everyone.

---

## 6. Feature Inventory (v1 → v3)

### v1 — MVP (Week 1–4)
- Onboarding: pick allergens (FDA Big 9 + sesame)
- Single grocery site support: **Amazon Fresh**
- Product tile badges: 🟢 Safe / 🔴 Unsafe / 🟡 Unknown
- Product detail page: ingredient list with flagged items highlighted
- Settings stored locally (`chrome.storage.sync`)
- Free, no auth

### v2 — Activation (Month 2)
- Add Instacart support
- Add Walmart Grocery support
- Email + password auth (Supabase)
- Multiple family profiles
- Cart review summary ("3 items contain milk")
- Custom allergens / avoid-list (seed oils, dyes, specific brands)
- Stripe paid tier ($6/mo Family)

### v3 — Retention & Expansion (Month 3–6)
- Recall alerts via openFDA + email/SMS push
- Shared profiles across devices (cloud sync)
- Onboarding wizard for new diagnoses (e.g., "newly diagnosed Celiac" template)
- Browse history: "Items you've bought containing X this month"
- Affiliate links to allergy-safe brands
- "Safekeeper" tier ($12/mo) with SMS recall alerts + school-lunch planner

### v4+ — Future bets (defer until $5K MRR)
- Outlook/Gmail receipt scanner for past grocery orders
- Restaurant menu parser (DoorDash, UberEats)
- iOS Safari extension
- Nutrition + ultra-processed scoring (NOVA)
- Brand certification program ("Verified Safe by SafeSnack")
- White-label B2B (allergist offices, school districts)

---

## 7. MVP Definition & Scope

### MVP success criteria (Day 30 post-launch)
- ✅ 100 active installs
- ✅ 20+ users with ≥3 sessions in last 7 days
- ✅ 3+ unsolicited testimonials in Reddit/FB groups
- ✅ ≥85% accuracy on top 1,000 Amazon Fresh SKUs (manual audit)
- ✅ 5+ users explicitly say "I would pay for this"

### In-scope for MVP
- Amazon Fresh only (`amazon.com/alm` and grocery routes)
- 10 allergens: milk, egg, peanut, tree nuts, soy, wheat (gluten), fish, shellfish, sesame, mustard
- Badge overlay on product tiles in search/category pages
- Ingredient highlight on product detail page
- Local settings storage
- Privacy policy + ToS pages on safesnack.co
- Basic landing page with install button

### Explicitly OUT of MVP
- ❌ Auth / accounts
- ❌ Cloud sync
- ❌ Payments
- ❌ Other sites (Instacart, Walmart, Kroger)
- ❌ Cart summary
- ❌ Recall alerts
- ❌ Family profiles
- ❌ Mobile
- ❌ Custom (non-allergen) avoid-lists
- ❌ Analytics dashboard for users

### MVP non-functional requirements
- Badge appears within **300ms** of page tile rendering (else feels broken)
- Works on Chrome, Edge, Brave (Chromium-based)
- < 5MB extension bundle
- No CPU spike on scroll (use IntersectionObserver, not poll)
- Crash-free across 1,000 products in a session

---

## 8. User Flows

### 8.1 First install
```
User clicks "Add to Chrome" on safesnack.co
  → Chrome installs extension
  → Onboarding tab opens automatically
  → Step 1: "Who is this for?" (single profile in MVP, default name "Me")
  → Step 2: "Pick allergens to flag" (10 chips, multi-select)
  → Step 3: "We'll show badges as you shop. Try it on Amazon Fresh →"
  → Settings persisted to chrome.storage.sync
  → Badge tutorial overlay appears once on first Amazon Fresh visit
```

### 8.2 Browsing search results
```
User searches "granola bars" on Amazon Fresh
  → Extension content script detects result tiles via DOM selector
  → For each tile: extract ASIN, title, image
  → Look up ingredients via cache → API → fallback "Unknown"
  → Inject colored badge (top-right of tile)
  → On hover: tooltip "Contains: peanuts, milk"
```

### 8.3 Product detail page
```
User clicks a product
  → Content script detects PDP route
  → Locate "Ingredients" section in DOM (multiple selectors fallback)
  → Run allergen detection on ingredient text
  → Inject highlighted spans + summary box at top of page
  → "🔴 Unsafe for your profile: contains MILK, SOY"
```

### 8.4 Settings change
```
User clicks extension icon → popup
  → Toggle allergens
  → Save → triggers re-scan of currently visible tiles
```

### 8.5 Unknown product flow
```
Product has no ingredient data
  → Badge shows 🟡 Unknown with question mark
  → Click → modal: "Help us — is this safe? Paste ingredients here"
  → User submission → queued for review (manual moderation in MVP)
```

---

## 9. Tech Stack

### Frontend (Extension)
- **Manifest V3** (required by Chrome 2024+)
- **TypeScript** — catches DOM/messaging bugs early
- **React 18** for popup + onboarding pages
- **Vite + @crxjs/vite-plugin** for hot-reload extension dev
- **Tailwind CSS** for styling (small footprint, fast iteration)
- **Zustand** for popup state (lighter than Redux)

### Backend (deferred to v2)
- **Next.js 14 (App Router)** on Vercel — API routes + landing page
- **Supabase** — Postgres + Auth + Storage + RLS
- **Upstash Redis** — ingredient cache (free tier 10K commands/day plenty)
- **Stripe** — payment links → checkout sessions later

### Data & ML
- **Open Food Facts API** — primary ingredient source
- **USDA FoodData Central** — branded foods fallback
- **OpenAI `gpt-4o-mini`** — only for ambiguous ingredient parsing (~$0.0001/lookup)
- **Custom dictionary** — allergen synonym mapping (whey → milk, semolina → wheat, etc.)

### Infra & Tooling
- **GitHub** monorepo
- **GitHub Actions** for CI (lint, type-check, build)
- **Sentry** for error tracking (free tier)
- **PostHog** for product analytics (free tier 1M events/mo)
- **Plausible** or **PostHog** for landing page analytics
- **Cloudflare** for safesnack.co DNS + CDN

### Why NOT certain things
- ❌ **No native app frameworks** (React Native, Capacitor) — extensions only.
- ❌ **No GraphQL** — overkill for this scope.
- ❌ **No microservices** — monolith Next.js wins for solo dev.
- ❌ **No custom ML model** — LLM API is cheaper and better than training your own for v1–v3.

---

## 10. System Architecture

### MVP architecture (no backend)
```
┌─────────────────────────────────────────────────────┐
│                Chrome Extension                      │
│                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ Content     │  │ Background   │  │ Popup UI   │  │
│  │ Script      │◄─┤ Service      │◄─┤ (React)    │  │
│  │ (Amazon)    │  │ Worker       │  │            │  │
│  └──────┬──────┘  └──────┬───────┘  └────────────┘  │
│         │                │                           │
│         │      chrome.storage.sync (settings)        │
│         │      chrome.storage.local (ingredient cache)│
└─────────┼────────────────┼───────────────────────────┘
          │                │
          │                ▼
          │         ┌──────────────────┐
          │         │ Open Food Facts  │
          │         │ REST API (free)  │
          │         └──────────────────┘
          │
          ▼
   Amazon Fresh DOM
   (no scraping of Amazon servers — read-only DOM injection)
```

### v2+ architecture (with backend)
```
┌─────────────────────┐
│  Chrome Extension   │
│  (TS + React)       │
└──────┬──────────────┘
       │ HTTPS + JWT
       ▼
┌─────────────────────────────────────────────┐
│  Next.js on Vercel                          │
│  /api/lookup     → ingredient lookup         │
│  /api/scan       → bulk scan                 │
│  /api/feedback   → user corrections          │
│  /api/auth/*     → Supabase auth proxy       │
│  /api/billing/*  → Stripe webhooks           │
└──────┬───────┬────────────┬─────────────────┘
       │       │            │
       ▼       ▼            ▼
   Supabase  Upstash    OpenAI
   (Postgres  Redis    (gpt-4o-mini,
    + Auth)  (cache)    fallback only)
       │
       ▼
   Open Food Facts + USDA + user submissions
```

### Component responsibilities

| Component | Responsibility |
|---|---|
| **Content script** | DOM observation, badge injection, send lookup requests to service worker |
| **Background SW** | Cache layer, API calls, message routing, settings sync |
| **Popup** | Settings UI, profile management, upgrade CTA |
| **Onboarding page** | First-run flow, profile creation |
| **Next.js API** (v2) | Auth, billing, server-side ingredient lookup with rate limits |
| **Supabase** | User accounts, profiles, allergen prefs, submission queue |
| **Redis cache** | Hot ingredient lookups (TTL 30 days) |

---

## 11. Data Model

### Local (chrome.storage.sync) — MVP
```ts
type LocalSettings = {
  version: 1;
  allergens: AllergenKey[];        // e.g. ['milk', 'peanut', 'sesame']
  customAvoid: string[];           // free-text, lowercased
  uiPreferences: {
    showBadgesOn: ('search' | 'pdp' | 'cart')[];
    badgeStyle: 'minimal' | 'verbose';
  };
  installedAt: string;             // ISO timestamp
  onboardingCompleted: boolean;
};

type AllergenKey =
  | 'milk' | 'egg' | 'peanut' | 'tree_nut'
  | 'soy' | 'wheat' | 'fish' | 'shellfish'
  | 'sesame' | 'mustard';
```

### Local (chrome.storage.local) — ingredient cache
```ts
type CachedIngredient = {
  productKey: string;              // 'amazon:B07XYZ123'
  ingredients: string;             // raw text
  detectedAllergens: AllergenKey[];
  source: 'amazon_dom' | 'off_api' | 'usda' | 'user_submission';
  fetchedAt: number;               // epoch ms
  ttl: number;                     // expires at
};
```

### Postgres schema (v2+)
```sql
-- users (managed by Supabase Auth)
-- referenced as auth.users.id

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz default now(),
  plan text default 'free' check (plan in ('free','family','safekeeper')),
  stripe_customer_id text
);

create table family_members (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references profiles(id) on delete cascade,
  name text not null,
  allergens text[] not null default '{}',
  custom_avoid text[] not null default '{}',
  created_at timestamptz default now()
);

create table ingredient_lookups (
  product_key text primary key,        -- 'amazon:B07XYZ123'
  site text not null,                  -- 'amazon_fresh'
  product_name text,
  ingredients_raw text,
  detected_allergens text[],
  source text,                         -- 'off' | 'usda' | 'llm' | 'user'
  confidence float,
  updated_at timestamptz default now()
);

create table user_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  product_key text,
  ingredients_text text,
  approved boolean default false,
  created_at timestamptz default now()
);

create table recall_alerts (
  id uuid primary key default gen_random_uuid(),
  fda_recall_id text unique,
  product_keywords text[],
  affected_brands text[],
  recall_date date,
  severity text,
  raw_payload jsonb
);

create table user_recall_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  recall_id uuid references recall_alerts(id),
  matched_at timestamptz default now(),
  notified boolean default false
);

-- RLS: every table scoped to auth.uid() = account_id
```

---

## 12. Allergen Detection Engine

### Pipeline (per product)
```
1. Get raw ingredient text
   └─ from Amazon DOM (`#important-information`, `.a-section.content`)
   └─ fallback: Open Food Facts by UPC/brand+name match
   └─ fallback: USDA FDC search
   └─ fallback: LLM extraction from "About this item" + bullets
   └─ fallback: Unknown badge

2. Normalize text
   └─ lowercase, strip parentheses content separately, expand abbreviations
   └─ split on commas + semicolons + "and"

3. Match against allergen synonym map
   └─ e.g. milk → [milk, whey, casein, lactose, ghee, butter, cream, cheese]
   └─ e.g. wheat → [wheat, gluten, semolina, durum, farina, spelt, kamut, einkorn, malt]

4. Score confidence
   └─ Direct match → 1.0
   └─ "may contain X" → 0.5 (separate "trace" flag)
   └─ "manufactured in facility with X" → 0.4
   └─ No ingredient list found → null (Unknown)

5. Output
   {
     allergens: ['milk', 'soy'],
     mayContain: ['peanut'],
     confidence: 0.95,
     source: 'amazon_dom'
   }
```

### Allergen synonym dictionary (excerpt — full file in `/data/allergens.json`)
```json
{
  "milk": ["milk", "whey", "casein", "caseinate", "lactose", "lactalbumin",
           "ghee", "butter", "cream", "cheese", "yogurt", "curd", "kefir",
           "buttermilk", "custard", "pudding", "ice cream", "milk solids",
           "milk fat", "milk powder", "skim", "condensed milk"],
  "wheat": ["wheat", "gluten", "semolina", "durum", "farina", "spelt",
            "kamut", "einkorn", "triticale", "bulgur", "couscous",
            "seitan", "atta", "matzo", "graham flour", "wheat starch",
            "hydrolyzed wheat protein"],
  "peanut": ["peanut", "groundnut", "monkey nut", "arachis oil",
             "mandelona", "beer nuts", "goober"]
  // ... etc for all 10
}
```

### LLM fallback prompt (only when heuristics fail)
```
System: You extract allergens from food ingredient lists. Return strict JSON.

User: Given the following product description, return:
{
  "ingredients_found": boolean,
  "ingredients_text": string | null,
  "allergens": string[],   // subset of [milk, egg, peanut, tree_nut, soy, wheat, fish, shellfish, sesame, mustard]
  "may_contain": string[],
  "confidence": float       // 0-1
}

Product: {{title}}
Description: {{description_first_2000_chars}}

Return JSON only. If no ingredient information is present, set ingredients_found=false.
```

### Confidence display rules

| Confidence | Badge | Behavior |
|---|---|---|
| ≥ 0.9 | 🔴 / 🟢 | Show definitive |
| 0.5 – 0.9 | 🔴 with "?" | Show flagged + "verify packaging" tooltip |
| < 0.5 | 🟡 Unknown | Prompt user to submit |

---

## 13. Data Sources & Coverage Strategy

| Source | Cost | Coverage | Use case |
|---|---|---|---|
| **Amazon DOM (own page)** | Free | 70% of Amazon Fresh have ingredients listed | Primary, no API call needed |
| **Open Food Facts** | Free | ~60% of US grocery SKUs | Fallback when Amazon DOM empty |
| **USDA FoodData Central** | Free | ~80% of US branded foods | Secondary fallback |
| **OpenAI gpt-4o-mini** | $0.15/M input | Anything with text | Last resort; ambiguous parses |
| **Spoonacular** | $29–499/mo | 365K+ SKUs, allergen-tagged | Skip for MVP, evaluate at v3 |
| **User submissions** | Free | Long tail | Compounds over time → moat |
| **Edamam Food Database** | $79/mo+ | Strong | Skip; OFF + USDA cover enough |

### Coverage targets
- **MVP launch:** 70% of top 5K Amazon Fresh products fully resolved
- **Month 3:** 90% of top 10K products
- **Month 6:** 95%, including Instacart + Walmart

---

## 14. Pricing & Monetization

### Tiers

| Plan | Price | Limits | Target |
|---|---|---|---|
| **Free** | $0 | 1 profile, 1 site (Amazon Fresh), 100 scans/mo | Trial / casual |
| **Family** | $6/mo or $49/yr | Unlimited profiles & scans, all sites | Allergy parents |
| **Safekeeper** | $12/mo or $99/yr | Family + recall SMS alerts + custom avoid-lists + lunch planner | Severe allergy / Celiac |

### Revenue assumptions (Year 1, conservative)
- 5,000 free users by month 12
- 8% paid conversion → 400 paid
- Mix: 70% Family, 30% Safekeeper → ARPU ≈ $7.80
- MRR ≈ $3,100 by month 12
- Annual run-rate ≈ $37K
- Year 2 trajectory: $80–150K ARR if retention holds

### Secondary revenue (Year 2+)
- Affiliate to Thrive Market, allergy-safe DTC brands → estimate $0.50–$2 per paid user/mo
- Brand "Certified Safe" badges → $99–499/mo per brand
- B2B licensing to allergist offices → $20/mo per office

### Payment infra — staged approach (no LLC required to start)

**Stage 1 (Month 2–6, pre-$3K MRR) — Merchant of Record**
- **LemonSqueezy** or **Paddle** handles checkout, US sales tax, EU VAT, invoicing, refunds.
- Payouts in USD to your Indian bank account (or Wise/Payoneer).
- Fee: ~5% + $0.50/txn (vs Stripe's 2.9% + $0.30) — worth it for zero legal/tax paperwork.
- **No US LLC, no US bank account, no Stripe Atlas needed.**
- Indian income tax paid normally on payouts (talk to a CA).

**Stage 2 (post-$3K MRR, if economics justify) — Direct Stripe via US LLC**
- Form Delaware LLC via Stripe Atlas (~$500) → Mercury bank account → Stripe US.
- Add Stripe Tax (~0.5% fee).
- ~2–3% transaction savings vs MoR ≈ pays for itself at $5K+ MRR.
- Adds ~$300/yr compliance overhead (Delaware franchise tax, registered agent).

**Stage 3 (post-$10K MRR or fundraising intent)** — convert LLC → Delaware C-Corp.

**Rules of thumb**
- Annual prepay encouraged with 2 months free regardless of stage.
- Never take card details yourself; always hosted checkout.

---

## 15. Security, Privacy & Liability

### Data we collect (minimize aggressively)
- ✅ Allergen preferences (local-only in MVP)
- ✅ Email (only when user creates account in v2)
- ✅ Usage events (anonymized, aggregated)
- ❌ Browsing history beyond grocery sites
- ❌ Personally identifying purchase data
- ❌ Health data beyond user-declared allergens

### Required pages on safesnack.co
- `/privacy` — GDPR + CCPA compliant
- `/terms` — explicit liability limitations
- `/security` — what we encrypt and where
- `/data-deletion` — one-click request

### Liability mitigations — staged

**Before free beta launch (Day 1, cheap and non-negotiable):**
1. **Terms of Service** with bold disclaimer:
   > "SafeSnack is a convenience tool, not a medical device. Always verify ingredients on product packaging. We are not liable for missed allergens or reactions."
2. **In-product nudge** on every Safe badge tooltip: *"Always verify packaging."* This single UX element does more legal work than an LLC.
3. **No medical claims** anywhere in marketing copy ("safer shopping," not "safe"; "flags allergens," not "prevents reactions").
4. **Privacy Policy** auto-generated via Termly (free) or GetTerms ($40).

**Before charging money (Month 2+):**
5. Pick a **Merchant of Record** (LemonSqueezy/Paddle). They absorb most transactional + tax liability.

**Before $3–5K MRR:**
6. **Form a US LLC** via Stripe Atlas or Firstbase (~$500) once revenue justifies the ~$300/yr compliance cost and you're switching off MoR.

**Before $10K MRR or 10K+ users:**
7. **Product liability insurance**: $1M policy via Hiscox / Next ($500–1500/yr).
8. **DPA + SOC 2 Lite** posture for B2B partnerships.

> **Why not form the LLC on Day 1?** For a free beta with < 1,000 users and zero revenue, the LLC adds cost and compliance overhead without meaningful protection. The disclaimer copy + MoR billing covers the realistic risk until you have a real business. Revisit at the $3K MRR gate.

### Security baseline
- Extension: Manifest V3 (no remote code), CSP locked down, no `eval`
- Backend: HTTPS only, JWT short-lived (15min), refresh tokens rotated
- Secrets in Vercel env + Supabase Vault, never in repo
- Supabase RLS on every table
- Sentry + audit log on auth events
- Dependabot + `npm audit` on CI

---

## 16. Analytics & Success Metrics

### North Star
**Weekly Protected Shoppers** = unique users who completed ≥1 grocery session with ≥5 badges shown that week.

### Activation funnel
1. Install
2. Onboarding completed (allergens picked) — target 80% of installs
3. First grocery session with ≥5 badges shown — target 50% within 7 days
4. Second session ≥7 days later — target 30%
5. Paid conversion — target 5–8%

### Engagement metrics (PostHog)
- Sessions/week per user
- Badges shown per session
- Unsafe items caught per user (great for testimonial copy)
- Submissions of unknown products
- Recall alerts triggered (v3)

### Quality metrics
- Detection accuracy on top 1K SKUs (manual audit weekly)
- False negative rate (target < 1%)
- "Unknown" rate (target < 15% by month 3)
- Page load impact (badge p95 < 300ms)

### Business metrics
- MRR, ARR, ARPU
- Net revenue retention (target > 100% via tier upgrades)
- CAC (informal — track by channel)
- LTV (target 18+ months)
- Free-to-paid conversion by cohort

---

## 17. Go-To-Market Plan

### Phase 1 — Private Beta (Weeks 1–4)
- Recruit 30 beta users from r/FoodAllergies + r/Celiac via authentic post
- Direct WhatsApp/Discord support
- Daily learning, ship fixes within 24h
- Goal: 10 highly active users + 3 testimonials

### Phase 2 — Soft launch (Month 2)
- Public Chrome Web Store listing
- Landing page with email capture for non-Chrome users
- Reddit posts (different angle each time, no spam)
- 3 long-form blog posts targeting SEO:
  - "Is X gluten-free? A complete guide to reading Amazon labels"
  - "Hidden sources of milk in packaged foods"
  - "How to shop Amazon Fresh with food allergies"
- Goal: 500 installs, 20 paid users

### Phase 3 — Community engine (Month 3–6)
- Partner with 3 allergy moms on Instagram (10–50K followers, $50–200 each)
- Submit to FARE newsletter (Food Allergy Research & Education)
- Outreach to 10 pediatric allergists with one-page handout
- Launch on Product Hunt (week aligned with v2 release)
- Goal: 5,000 installs, 200 paid users

### Phase 4 — Scale + Expand (Month 6–12)
- SEO compounds (50+ articles)
- Add Instacart + Walmart drives 2nd install wave
- Affiliate revenue kicks in
- First press hit (Lifehacker / Wirecutter / allergy blogs)
- Goal: 20,000 installs, $5K MRR

### Channels we will NOT pursue
- ❌ Paid Google/Meta ads — CAC won't pencil at $6/mo ARPU
- ❌ TikTok virality plays — wrong demographic
- ❌ Cold outreach to grocery retailers — wrong sales motion

---

## 18. Roadmap & Milestones

### Sprint 0 — Setup (Days 1–3)
- [ ] Set up GitHub monorepo (pnpm workspaces)
- [ ] Scaffold Vite + CRX + React + Tailwind (extension app)
- [ ] Scaffold Next.js app for landing page
- [ ] Connect safesnack.co to Vercel (free tier)
- [ ] Generate Privacy Policy + ToS via Termly/GetTerms, customize
- [ ] Buy Chrome Web Store developer account ($5 one-time)
- [ ] Set up Sentry + PostHog free tiers
- [ ] *(Deferred to Month 2+)* LLC formation — not needed for free beta

### Sprint 1 — MVP Core (Days 4–14)
- [ ] Allergen synonym dictionary (10 allergens)
- [ ] Amazon Fresh DOM selectors + content script
- [ ] Badge UI components
- [ ] Local settings + onboarding flow
- [ ] Open Food Facts integration
- [ ] Basic landing page

### Sprint 2 — Beta (Days 15–28)
- [ ] Recruit 30 beta users
- [ ] Sentry + PostHog wired
- [ ] Manual QA on top 1K Amazon SKUs
- [ ] Iterate on badge UX (3–5 rounds)
- [ ] First testimonials collected

### Sprint 3 — Public Launch (Days 29–45)
- [ ] Submit to Chrome Web Store (1–2 week review)
- [ ] Publish 3 SEO blog posts
- [ ] Reddit launch posts
- [ ] First 500 installs

### Sprint 4 — Backend + Auth (Days 46–75)
- [ ] Supabase setup, schema, RLS
- [ ] Auth flow + family profiles
- [ ] Cloud sync of preferences
- [ ] Stripe Family tier launch

### Sprint 5 — Multi-site (Days 76–105)
- [ ] Instacart support
- [ ] Walmart Grocery support
- [ ] Cart review summary
- [ ] First $1K MRR target

### Sprint 6 — Recall alerts + Safekeeper tier (Days 106–135)
- [ ] openFDA integration + cron job
- [ ] Email + Twilio SMS notifications
- [ ] Safekeeper tier launch
- [ ] Product Hunt launch

---

## 19. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Amazon changes DOM, breaks extension | High | High | Resilient selectors (multiple fallbacks); CI integration test against real pages weekly |
| False negative causes allergic reaction → lawsuit | Low | Catastrophic | ToS disclaimer + "always verify" UI nudges (Day 1) → MoR billing (Month 2) → LLC + $1M insurance (post-$3K MRR) |
| Chrome Web Store rejects extension | Medium | High | Follow Manifest V3 strictly; minimal permissions; clear privacy policy |
| Low free→paid conversion | High | High | Family-sharing as paid-only feature; school-lunch planner upsell |
| Yuka/Fig launches Chrome extension | Low | Medium | Move fast on multi-site coverage; build user-correction moat |
| Open Food Facts data quality | Medium | Medium | Layer USDA + LLM + user submissions |
| Solo founder burnout | High | Catastrophic | Strict 2-week sprints; one feature at a time; weekly retro |
| Accepting USD payments from India | Medium | Medium | Use LemonSqueezy/Paddle (Merchant of Record) from Day 1 of paid tier. Form Stripe Atlas LLC only once revenue justifies it (~$3K MRR). |
| OpenAI API cost spike | Low | Low | Cache aggressively; LLM only on miss; rate limit per user |

---

## 20. Open Questions

These need answers before or during Sprint 1.

1. **Does Amazon Fresh's ToS prohibit DOM injection by extensions?**
   → Research; precedent says no (Honey, Capital One Shopping operate similarly), but verify.
2. **What's the actual hit rate of Open Food Facts on Amazon Fresh top 1K SKUs?**
   → Spike: manually test 50 SKUs, extrapolate.
3. **Should we support custom allergens (not just FDA Big 9 + sesame) in MVP?**
   → Recommendation: NO. Add in v2.
4. **Do we need Spanish localization for first 1,000 users?**
   → Recommendation: NO. English US-only until $3K MRR.
5. **Family-sharing UX: separate accounts or sub-profiles?**
   → Recommendation: sub-profiles under one account (simpler billing).
6. **Should we open-source the allergen dictionary?**
   → Recommendation: YES, on GitHub. Builds trust and invites community contribution.
7. **What's the Chrome Web Store review timeline in 2026?**
   → Currently 1–2 weeks for new extensions; budget 3.

---

## 21. Appendix: File/Folder Layout

```
safesnack/
├── apps/
│   ├── extension/                 # Chrome extension (Vite + CRX)
│   │   ├── src/
│   │   │   ├── background/        # service worker
│   │   │   │   └── index.ts
│   │   │   ├── content/           # content scripts per site
│   │   │   │   ├── amazon-fresh.ts
│   │   │   │   ├── instacart.ts   # v2
│   │   │   │   └── shared/
│   │   │   │       ├── badge.tsx
│   │   │   │       ├── highlighter.ts
│   │   │   │       └── observer.ts
│   │   │   ├── popup/             # extension popup UI
│   │   │   │   ├── App.tsx
│   │   │   │   ├── components/
│   │   │   │   └── store.ts       # zustand
│   │   │   ├── onboarding/        # first-run page
│   │   │   │   └── index.html
│   │   │   ├── core/              # business logic
│   │   │   │   ├── detector.ts    # allergen detection engine
│   │   │   │   ├── normalizer.ts
│   │   │   │   ├── cache.ts
│   │   │   │   └── types.ts
│   │   │   ├── data/
│   │   │   │   └── allergens.json # synonym dictionary
│   │   │   ├── services/          # external API wrappers
│   │   │   │   ├── openFoodFacts.ts
│   │   │   │   ├── usda.ts
│   │   │   │   └── analytics.ts
│   │   │   └── manifest.config.ts
│   │   ├── public/
│   │   ├── tests/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   │
│   └── web/                       # Next.js landing + API (v2+)
│       ├── app/
│       │   ├── (marketing)/
│       │   │   ├── page.tsx       # landing
│       │   │   ├── pricing/
│       │   │   ├── privacy/
│       │   │   ├── terms/
│       │   │   └── blog/[slug]/
│       │   ├── (app)/
│       │   │   ├── account/
│       │   │   └── family/
│       │   └── api/
│       │       ├── lookup/route.ts
│       │       ├── feedback/route.ts
│       │       └── billing/webhook/route.ts
│       ├── lib/
│       │   ├── supabase.ts
│       │   ├── stripe.ts
│       │   └── allergens.ts
│       ├── package.json
│       └── next.config.js
│
├── packages/
│   ├── allergen-engine/           # shared detection logic (extension + backend)
│   │   ├── src/
│   │   │   ├── detect.ts
│   │   │   ├── synonyms.ts
│   │   │   └── index.ts
│   │   └── package.json
│   └── shared-types/
│       ├── src/index.ts
│       └── package.json
│
├── infra/
│   ├── supabase/
│   │   ├── migrations/
│   │   └── seed.sql
│   └── github-actions/
│       ├── ci.yml
│       └── extension-release.yml
│
├── docs/
│   ├── PRD.md                     # this file (or symlink to root)
│   ├── ARCHITECTURE.md
│   ├── ALLERGEN_DICTIONARY.md
│   ├── PRIVACY.md
│   └── BETA_USER_GUIDE.md
│
├── .gitignore
├── package.json                   # workspace root
├── pnpm-workspace.yaml
└── README.md
```

---

## Closing Note

> **Build Sprint 0 + Sprint 1 only.** Do not read or expand v3+ scope until 100 real users have installed the MVP. The biggest risk to this product is not technical — it's spending 3 months perfecting features no one uses.
>
> Ship in 2 weeks. Ugly is fine. Wrong is fixable. Slow kills.

---

**Next document to create after first 3 user interviews:** `docs/USER_INSIGHTS.md` — verbatim quotes, pain rankings, language for landing page copy.
