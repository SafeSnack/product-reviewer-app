/**
 * Generates Chrome Web Store PNG assets from inline SVG templates.
 * Run: pnpm --filter @safesnack/extension exec node scripts/generate-store-assets.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'store-assets');

const emerald = {
  50: '#ecfdf5',
  600: '#059669',
  700: '#047857',
  800: '#065f46',
};

function iconSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${emerald[600]}"/>
      <stop offset="100%" stop-color="${emerald[700]}"/>
    </linearGradient>
  </defs>
  <!-- rounded square; keep art inside ~10% inset = Web Store safe zone -->
  <rect x="0" y="0" width="128" height="128" rx="26" fill="url(#bg)"/>
  <!-- shield -->
  <path fill="#ffffff" fill-opacity="0.95"
    d="M64 22 L90 35.5 V60 Q90 86 64 104 Q38 86 38 60 V35.5 Z"/>
  <!-- subtle inner shadow edge -->
  <path fill="none" stroke="${emerald[800]}" stroke-opacity="0.12" stroke-width="1"
    d="M64 24 L88 36.2 V60 Q88 84.5 64 101.5 Q40 84.5 40 60 V36.2 Z"/>
  <!-- leaf mark (upper right on shield) -->
  <path fill="#a7f3d0"
    d="M78 30 Q88 24 93 34 Q91 42 81 46 Q75 38 78 30"/>
  <path fill="none" stroke="#047857" stroke-width="0.8" stroke-linecap="round"
    d="M80 33 Q84 36 82 41"/>
  <!-- S letterform -->
  <path fill="${emerald[700]}"
    d="M56 52 C56 48 59 45 64 45 C69 45 72 47 73 50 L69 52 C68 50 66 49 64 49 C62 49 60 50 60 52 C60 54 62 55 65 56 C70 57 73 59 73 64 C73 69 69 72 64 72 C58 72 54 69 53 65 L57 63 C58 66 60 68 64 68 C67 68 69 66 69 64 C69 62 67 61 63 60 C58 59 56 56 56 52 Z"/>
</svg>`;
}

function escXml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** @param {{ label: string, on: boolean, accent: string }} o */
function allergenChip(o) {
  const border = o.on ? emerald[600] : '#e2e8f0';
  const bg = o.on ? emerald[50] : '#ffffff';
  const ring = o.on ? `stroke="${emerald[600]}" stroke-width="2" stroke-opacity="0.35"` : '';
  return `
  <g>
    <rect width="252" height="60" rx="12" fill="${bg}" stroke="${border}" stroke-width="1.5"/>
    <rect x="2" y="2" width="248" height="56" rx="10" fill="none" ${ring}/>
    <g transform="translate(14,18)">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="none" stroke="${o.accent}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <text x="44" y="34" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="14" font-weight="600" fill="#0f172a">${escXml(o.label)}</text>
  </g>`;
}

function screenshotOnboardingStep2() {
  const chips = [
    { label: 'Milk', on: true, accent: '#0369a1' },
    { label: 'Egg', on: false, accent: '#b45309' },
    { label: 'Peanut', on: true, accent: '#9a3412' },
    { label: 'Tree Nuts', on: false, accent: '#3f6212' },
    { label: 'Soy', on: false, accent: '#166534' },
    { label: 'Wheat / Gluten', on: true, accent: '#a16207' },
    { label: 'Fish', on: false, accent: '#1e40af' },
    { label: 'Shellfish', on: false, accent: '#0e7490' },
    { label: 'Sesame', on: false, accent: '#78350f' },
    { label: 'Mustard', on: false, accent: '#713f12' },
  ];
  const cells = chips
    .map((c, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 80 + col * 268;
      const y = 200 + row * 72;
      return `<svg x="${x}" y="${y}" width="252" height="60">${allergenChip(c)}</svg>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800">
  <rect width="1280" height="800" fill="#f8fafc"/>
  <rect width="1280" height="52" fill="#ffffff" stroke="#e2e8f0"/>
  <text x="640" y="33" text-anchor="middle" font-family="system-ui" font-size="11" font-weight="700" fill="#64748b" letter-spacing="0.08em">SAFESNACK</text>
  <text x="80" y="118" font-family="system-ui" font-size="12" fill="#64748b">Step 2 of 3</text>
  <text x="1180" y="118" text-anchor="end" font-family="system-ui" font-size="12" fill="#065f46" text-decoration="underline">Back</text>
  <text x="80" y="168" font-family="system-ui" font-size="28" font-weight="650" fill="#0f172a">Pick your allergens</text>
  ${cells}
  <text x="80" y="620" font-family="system-ui" font-size="14" fill="#475569">You can change these anytime from the extension icon.</text>
  <rect x="80" y="660" width="1120" height="48" rx="12" fill="${emerald[700]}"/>
  <text x="640" y="691" text-anchor="middle" font-family="system-ui" font-size="16" font-weight="650" fill="#ffffff">Continue</text>
  <rect y="736" width="1280" height="64" fill="#ffffff" stroke="#e2e8f0"/>
  <text x="640" y="772" text-anchor="middle" font-family="system-ui" font-size="11" fill="#64748b">Always verify packaging. Ingredient data can be incomplete or change.</text>
</svg>`;
}

function badgeCircle(x, y, fill, letter) {
  return `
  <g transform="translate(${x},${y})">
    <circle r="16" fill="${fill}" stroke="#ffffff" stroke-width="2"/>
    <text x="0" y="5" text-anchor="middle" font-family="system-ui" font-weight="700" font-size="14" fill="#ffffff">${escXml(letter)}</text>
  </g>`;
}

function screenshotAmazonSearch() {
  const tiles = [
    { x: 48, y: 220, letter: '✓', fill: '#16a34a', title: 'Organic Baby Spinach' },
    { x: 340, y: 220, letter: '!', fill: '#dc2626', title: 'Chocolate Chip Cookies' },
    { x: 632, y: 220, letter: '?', fill: '#d97706', title: 'Seasoning Blend' },
    { x: 924, y: 220, letter: '✓', fill: '#16a34a', title: 'Whole Milk Greek Yogurt' },
    { x: 48, y: 480, letter: '!', fill: '#dc2626', title: 'Granola Bars — Peanut' },
    { x: 340, y: 480, letter: '✓', fill: '#16a34a', title: 'Brown Rice Cakes' },
    { x: 632, y: 480, letter: '?', fill: '#d97706', title: 'Mixed Nuts Trail Mix' },
    { x: 924, y: 480, letter: '✓', fill: '#16a34a', title: 'Sliced Cucumbers' },
  ];
  const tileSvgs = tiles
    .map((t) => {
      const bx = t.x + 200;
      const by = t.y + 16;
      return `
    <g>
      <rect x="${t.x}" y="${t.y}" width="280" height="220" rx="4" fill="#ffffff" stroke="#e5e7eb"/>
      <rect x="${t.x + 12}" y="${t.y + 12}" width="256" height="160" rx="2" fill="#f1f5f9"/>
      ${badgeCircle(bx, by, t.fill, t.letter)}
      <text x="${t.x + 14}" y="${t.y + 200}" font-family="system-ui" font-size="13" fill="#0f172a">${escXml(t.title)}</text>
    </g>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800">
  <rect width="1280" height="800" fill="#ffffff"/>
  <rect width="1280" height="56" fill="#131921"/>
  <text x="24" y="36" font-family="system-ui" font-size="15" font-weight="600" fill="#ffffff">amazon</text>
  <text x="108" y="36" font-family="system-ui" font-size="15" fill="#febd69">Fresh</text>
  <rect x="200" y="14" width="720" height="32" rx="4" fill="#febd69"/>
  <text x="216" y="34" font-family="system-ui" font-size="13" fill="#111827">Search Amazon Fresh</text>
  <text x="48" y="120" font-family="system-ui" font-size="13" fill="#64748b">Grocery › Produce</text>
  <text x="48" y="168" font-family="system-ui" font-size="22" font-weight="650" fill="#0f172a">Search results</text>
  <text x="48" y="198" font-family="system-ui" font-size="12" fill="#64748b">Illustrative results. Badges match extension: ✓ safe, ! flagged, ? unknown.</text>
  ${tileSvgs}
</svg>`;
}

function screenshotAmazonPdp() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800">
  <rect width="1280" height="800" fill="#ffffff"/>
  <rect width="1280" height="56" fill="#131921"/>
  <text x="24" y="36" font-family="system-ui" font-size="15" font-weight="600" fill="#ffffff">amazon</text>
  <text x="108" y="36" font-family="system-ui" font-size="15" fill="#febd69">Fresh</text>
  <rect x="48" y="88" width="420" height="420" rx="4" fill="#f8fafc" stroke="#e2e8f0"/>
  <text x="520" y="120" font-family="system-ui" font-size="22" font-weight="650" fill="#0f172a">Fresh Pasta, 16 oz (packaging may vary)</text>
  <text x="520" y="160" font-family="system-ui" font-size="14" fill="#64748b">Brand: Example Kitchen</text>
  <rect x="520" y="200" width="700" height="1" fill="#e2e8f0"/>
  <text x="520" y="240" font-family="system-ui" font-size="16" font-weight="650" fill="#0f172a">Ingredients</text>
  <rect x="520" y="260" width="700" height="120" rx="6" fill="#fffbeb" stroke="#fcd34d"/>
  <text font-family="system-ui" font-size="14" fill="#0f172a">
    <tspan x="536" y="286" fill="#b45309" font-weight="700">Ingredients:</tspan>
    <tspan fill="#0f172a"> Water, </tspan>
    <tspan fill="#b91c1c" font-weight="700" text-decoration="underline">semolina wheat</tspan>
    <tspan fill="#0f172a">, </tspan>
    <tspan fill="#b91c1c" font-weight="700" text-decoration="underline">durum wheat flour</tspan>
    <tspan fill="#0f172a">, </tspan>
    <tspan fill="#b91c1c" font-weight="700" text-decoration="underline">eggs</tspan>
    <tspan fill="#0f172a">, salt. Contains: </tspan>
    <tspan fill="#b91c1c" font-weight="700">wheat, egg</tspan>
    <tspan fill="#0f172a">. May contain: milk, soy.</tspan>
  </text>
  <text x="520" y="420" font-family="system-ui" font-size="12" fill="#64748b">Highlighted terms match your selected allergens (illustrative).</text>
  <rect x="520" y="460" width="220" height="36" rx="6" fill="#fef3c7" stroke="#d97706"/>
  <text x="630" y="483" text-anchor="middle" font-family="system-ui" font-size="13" font-weight="650" fill="#92400e">Unknown confidence — verify packaging</text>
</svg>`;
}

function screenshotPopup() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800">
  <defs>
    <linearGradient id="desk" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#e2e8f0"/>
      <stop offset="100%" stop-color="#cbd5e1"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="800" fill="url(#desk)"/>
  <rect x="72" y="48" width="1136" height="56" rx="10" fill="#f1f5f9" stroke="#94a3b8"/>
  <circle cx="96" cy="76" r="8" fill="#ef4444"/><circle cx="118" cy="76" r="8" fill="#f59e0b"/><circle cx="140" cy="76" r="8" fill="#22c55e"/>
  <rect x="180" y="62" width="900" height="28" rx="6" fill="#ffffff" stroke="#cbd5e1"/>
  <text x="200" y="81" font-family="system-ui" font-size="12" fill="#64748b">amazon.com/alm/...</text>
  <g transform="translate(780, 140)">
    <rect width="360" height="480" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
    <rect width="360" height="48" fill="#ffffff" stroke="#e2e8f0"/>
    <text x="16" y="32" font-family="system-ui" font-size="16" font-weight="650" fill="#0f172a">SafeSnack</text>
    <text x="300" y="32" text-anchor="end" font-family="system-ui" font-size="11" fill="#64748b">v0.1.0</text>
    <rect x="12" y="60" width="336" height="88" rx="12" fill="#ffffff" stroke="#e2e8f0"/>
    <text x="24" y="86" font-family="system-ui" font-size="10" font-weight="600" fill="#64748b">PROTECTING FOR</text>
    <text x="24" y="112" font-family="system-ui" font-size="13" fill="#1e293b">Milk, Peanut, Wheat / Gluten</text>
    <text x="300" y="112" text-anchor="end" font-family="system-ui" font-size="13" font-weight="600" fill="#065f46" text-decoration="underline">Edit</text>
    <rect x="12" y="160" width="336" height="36" rx="10" fill="#ffffff" stroke="#e2e8f0"/>
    <text x="24" y="184" font-family="system-ui" font-size="13" font-weight="650" fill="#1e293b">Allergens</text>
    <text x="320" y="184" text-anchor="end" font-family="system-ui" fill="#94a3b8">▾</text>
    <rect x="12" y="194" width="336" height="160" rx="0" fill="#ffffff" stroke="#e2e8f0"/>
    <text x="24" y="218" font-family="system-ui" font-size="11" fill="#64748b">Tap to toggle; saves immediately.</text>
    <rect x="24" y="232" width="150" height="40" rx="8" fill="${emerald[50]}" stroke="${emerald[600]}" stroke-width="1.5"/>
    <text x="88" y="257" text-anchor="middle" font-family="system-ui" font-size="11" font-weight="600" fill="#0f172a">Milk</text>
    <rect x="186" y="232" width="150" height="40" rx="8" fill="#f8fafc" stroke="#e2e8f0"/>
    <text x="261" y="257" text-anchor="middle" font-family="system-ui" font-size="11" font-weight="600" fill="#0f172a">Egg</text>
    <rect x="24" y="282" width="150" height="40" rx="8" fill="${emerald[50]}" stroke="${emerald[600]}"/>
    <text x="99" y="307" text-anchor="middle" font-family="system-ui" font-size="11" font-weight="600">Peanut</text>
    <rect x="186" y="282" width="150" height="40" rx="8" fill="#f8fafc" stroke="#e2e8f0"/>
    <text x="261" y="307" text-anchor="middle" font-family="system-ui" font-size="11" font-weight="600">Soy</text>
    <text x="24" y="360" font-family="system-ui" font-size="13" fill="#334155"><tspan font-weight="650" fill="#0f172a">Products scanned today:</tspan> 42</text>
    <text x="24" y="384" font-family="system-ui" font-size="13" fill="#334155"><tspan font-weight="650" fill="#0f172a">Unsafe results shown:</tspan> 6</text>
    <rect y="408" width="360" height="72" fill="#ffffff" stroke="#e2e8f0"/>
    <text x="180" y="438" text-anchor="middle" font-family="system-ui" font-size="10" fill="#475569">Always verify packaging. SafeSnack reads on-page data only.</text>
    <text x="180" y="460" text-anchor="middle" font-family="system-ui" font-size="10" font-weight="600" fill="#065f46" text-decoration="underline">Privacy · Terms · Feedback</text>
  </g>
</svg>`;
}

function screenshotHelpModal() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800">
  <rect width="1280" height="800" fill="#64748b" fill-opacity="0.35"/>
  <rect x="0" y="0" width="1280" height="800" fill="#0f172a" fill-opacity="0.25"/>
  <g transform="translate(430, 160)">
    <rect width="420" height="440" rx="10" fill="#ffffff"/>
    <text x="24" y="44" font-family="system-ui" font-size="16" font-weight="650" fill="#111827">Help us — ingredients</text>
    <text x="24" y="72" font-family="system-ui" font-size="14" fill="#374151">Seasoning Blend (example SKU)</text>
    <text x="24" y="104" font-family="system-ui" font-size="13" font-weight="650" fill="#111827">Ingredient list</text>
    <rect x="24" y="114" width="372" height="140" rx="6" fill="#ffffff" stroke="#d1d5db"/>
    <text x="36" y="140" font-family="system-ui" font-size="13" fill="#94a3b8">Paste ingredients from packaging…</text>
    <text x="24" y="280" font-family="system-ui" font-size="12" fill="#6b7280">Paste text from packaging. Always verify packaging — submissions are local only in MVP.</text>
    <rect x="220" y="360" width="80" height="36" rx="6" fill="#f9fafb" stroke="#d1d5db"/>
    <text x="260" y="383" text-anchor="middle" font-family="system-ui" font-size="13" fill="#111827">Cancel</text>
    <rect x="310" y="360" width="86" height="36" rx="6" fill="#2563eb" stroke="#1d4ed8"/>
    <text x="353" y="383" text-anchor="middle" font-family="system-ui" font-size="13" font-weight="600" fill="#ffffff">Submit</text>
  </g>
</svg>`;
}

function promoSmall() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="440" height="280" viewBox="0 0 440 280">
  <defs>
    <linearGradient id="ps" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#065f46"/>
    </linearGradient>
  </defs>
  <rect width="440" height="280" rx="16" fill="url(#ps)"/>
  <text x="32" y="56" font-family="system-ui" font-size="26" font-weight="750" fill="#ffffff">SafeSnack</text>
  <text x="32" y="92" font-family="system-ui" font-size="15" fill="#d1fae5">Allergen badges on Amazon Fresh</text>
  <g transform="translate(280, 40) scale(0.85)">
    <rect width="128" height="128" rx="26" fill="#ffffff" fill-opacity="0.15"/>
    <path fill="#ffffff" fill-opacity="0.95" transform="translate(20,18) scale(0.72)"
      d="M64 22 L90 35.5 V60 Q90 86 64 104 Q38 86 38 60 V35.5 Z"/>
  </g>
  <rect x="32" y="130" width="96" height="96" rx="8" fill="#ffffff" fill-opacity="0.95"/>
  <circle cx="68" cy="162" r="14" fill="#16a34a"/><text x="68" y="168" text-anchor="middle" font-family="system-ui" font-weight="800" font-size="13" fill="#fff">✓</text>
  <text x="80" y="200" text-anchor="middle" font-family="system-ui" font-size="10" fill="#0f172a">Safe</text>
  <rect x="144" y="130" width="96" height="96" rx="8" fill="#ffffff" fill-opacity="0.95"/>
  <circle cx="192" cy="162" r="14" fill="#dc2626"/><text x="192" y="168" text-anchor="middle" font-family="system-ui" font-weight="800" font-size="14" fill="#fff">!</text>
  <text x="192" y="200" text-anchor="middle" font-family="system-ui" font-size="10" fill="#0f172a">Flagged</text>
  <rect x="256" y="130" width="96" height="96" rx="8" fill="#ffffff" fill-opacity="0.95"/>
  <circle cx="304" cy="162" r="14" fill="#d97706"/><text x="304" y="167" text-anchor="middle" font-family="system-ui" font-weight="800" font-size="12" fill="#fff">?</text>
  <text x="304" y="200" text-anchor="middle" font-family="system-ui" font-size="10" fill="#0f172a">Unknown</text>
  <text x="32" y="256" font-family="system-ui" font-size="11" fill="#a7f3d0">Privacy-first · Free · Chrome</text>
</svg>`;
}

function promoMarquee() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="560" viewBox="0 0 1400 560">
  <defs>
    <linearGradient id="pm" x1="0%" y1="50%" x2="100%" y2="50%">
      <stop offset="0%" stop-color="#022c22"/>
      <stop offset="55%" stop-color="#065f46"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
  </defs>
  <rect width="1400" height="560" fill="url(#pm)"/>
  <text x="72" y="200" font-family="system-ui" font-size="56" font-weight="750" fill="#ffffff">Shop Amazon Fresh with clarity.</text>
  <text x="72" y="270" font-family="system-ui" font-size="22" fill="#d1fae5">SafeSnack overlays simple red / green / amber badges while you browse — based on your allergen list.</text>
  <text x="72" y="330" font-family="system-ui" font-size="16" fill="#a7f3d0">Local settings · On-page reading · Not medical advice</text>
  <g transform="translate(920, 120)">
    <rect x="0" y="0" width="380" height="320" rx="12" fill="#ffffff" fill-opacity="0.08" stroke="#34d399" stroke-opacity="0.4"/>
    <rect x="24" y="24" width="332" height="200" rx="6" fill="#f8fafc"/>
    <text x="40" y="52" font-family="system-ui" font-size="12" fill="#64748b">Search results (illustrative)</text>
    <rect x="40" y="70" width="90" height="72" fill="#e2e8f0"/>
    <circle cx="115" cy="88" r="12" fill="#16a34a"/><text x="115" y="93" text-anchor="middle" font-family="system-ui" font-weight="700" font-size="12" fill="#fff">✓</text>
    <rect x="150" y="70" width="90" height="72" fill="#e2e8f0"/>
    <circle cx="225" cy="88" r="12" fill="#dc2626"/><text x="225" y="93" text-anchor="middle" font-family="system-ui" font-weight="700" font-size="12" fill="#fff">!</text>
    <rect x="260" y="70" width="90" height="72" fill="#e2e8f0"/>
    <circle cx="335" cy="88" r="12" fill="#d97706"/><text x="335" y="93" text-anchor="middle" font-family="system-ui" font-weight="700" font-size="11" fill="#fff">?</text>
    <text x="40" y="200" font-family="system-ui" font-size="11" fill="#475569">Ingredients highlighted on product pages.</text>
    <text x="40" y="280" font-family="system-ui" font-size="14" font-weight="650" fill="#ffffff">Always verify packaging.</text>
  </g>
</svg>`;
}

async function writePng(name, svgString) {
  const buf = Buffer.from(svgString, 'utf8');
  await sharp(buf).png({ compressionLevel: 9 }).toFile(path.join(outDir, name));
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });

  const iconBuf = Buffer.from(iconSvg(), 'utf8');
  const sizes = [128, 48, 32, 16];
  for (const w of sizes) {
    await sharp(iconBuf)
      .resize(w, w, { fit: 'fill' })
      .png({ compressionLevel: 9 })
      .toFile(path.join(outDir, `icon-${w}.png`));
  }

  await writePng('screenshot-01-onboarding-allergen-picker.png', screenshotOnboardingStep2());
  await writePng('screenshot-02-amazon-search-badges.png', screenshotAmazonSearch());
  await writePng('screenshot-03-amazon-pdp-ingredients.png', screenshotAmazonPdp());
  await writePng('screenshot-04-popup-settings.png', screenshotPopup());
  await writePng('screenshot-05-help-us-modal.png', screenshotHelpModal());
  await writePng('promo-small-440x280.png', promoSmall());
  await writePng('promo-marquee-1400x560.png', promoMarquee());

  // Verify dimensions
  const files = [
    ['icon-128.png', 128, 128],
    ['icon-48.png', 48, 48],
    ['icon-32.png', 32, 32],
    ['icon-16.png', 16, 16],
    ['screenshot-01-onboarding-allergen-picker.png', 1280, 800],
    ['screenshot-02-amazon-search-badges.png', 1280, 800],
    ['screenshot-03-amazon-pdp-ingredients.png', 1280, 800],
    ['screenshot-04-popup-settings.png', 1280, 800],
    ['screenshot-05-help-us-modal.png', 1280, 800],
    ['promo-small-440x280.png', 440, 280],
    ['promo-marquee-1400x560.png', 1400, 560],
  ];
  for (const [f, ew, eh] of files) {
    const m = await sharp(path.join(outDir, f)).metadata();
    if (m.width !== ew || m.height !== eh) {
      throw new Error(`Bad size for ${f}: got ${m.width}x${m.height}, want ${ew}x${eh}`);
    }
  }

  console.log('Wrote store assets to', outDir);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
