import { ChevronDown, HeartHandshake, Lock, ShieldAlert, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { EmailCaptureForm } from './components/EmailCaptureForm';

const GITHUB_URL = process.env.NEXT_PUBLIC_GITHUB_URL;

const faqItems: { q: string; a: string }[] = [
  {
    q: 'Is SafeSnack free?',
    a: 'Yes. The MVP is free with no login or payment wall. If paid tiers ship later, we still avoid dark patterns and ads on the free tier—buyer trust over growth hacks.',
  },
  {
    q: 'What grocery sites are supported?',
    a: 'Amazon Fresh in Chrome today. Instacart and Walmart Grocery are planned next; they are not in the MVP yet.',
  },
  {
    q: 'How accurate is it?',
    a: 'We bias to Unknown when confidence is low—a missed allergen is unacceptable. Ingredient data can be incomplete, stale, or wrong. SafeSnack never replaces reading the label; always verify packaging.',
  },
  {
    q: 'Is my data shared?',
    a: 'We do not sell your data. The MVP keeps allergen preferences in your browser (Chrome sync), not on our servers for core detection—privacy-first, minimal collection.',
  },
  {
    q: 'Does it work on mobile?',
    a: 'Not today. SafeSnack is a desktop Chrome extension for grocery websites. Mobile barcode apps cover a different shopping moment.',
  },
  {
    q: 'What if a product has no ingredients?',
    a: 'We show Unknown and prompt you to verify on packaging. We do not auto-upgrade Unknown to Safe without evidence—honest about uncertainty.',
  },
  {
    q: 'Who built this?',
    a: 'SafeSnack is an independent product built for families navigating food allergies, with room for community corrections to improve data for everyone.',
  },
  {
    q: 'How is this different from Yuka?',
    a: 'Yuka is a mobile barcode-first experience. SafeSnack flags allergens inline while you browse Amazon Fresh in the browser—desktop online grocery is the wedge.',
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only left-4 top-4 z-[100] rounded-md bg-white px-4 py-2 text-sm font-medium text-stone-900 shadow ring-1 ring-stone-200 focus:not-sr-only focus:absolute focus:outline-none focus:ring-2 focus:ring-accent"
      >
        Skip to main content
      </a>

      <header className="border-b border-stone-200/80 bg-stone-50/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-lg font-semibold tracking-tight text-stone-900">
            SafeSnack
          </Link>
          <nav aria-label="Site" className="flex gap-4 text-sm font-medium text-stone-600">
            <Link href="/privacy" className="transition-colors hover:text-accent">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-accent">
              Terms
            </Link>
            <Link href="/install" className="text-accent transition-colors hover:text-green-700">
              Install
            </Link>
          </nav>
        </div>
      </header>

      <main id="main-content" className="flex-1">
        {/* Hero */}
        <section
          aria-labelledby="hero-heading"
          className="border-b border-stone-200/80 bg-gradient-to-b from-white to-stone-50"
        >
          <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:items-center lg:gap-12 lg:py-20">
            <div>
              <h1
                id="hero-heading"
                className="text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl lg:text-[2.75rem] lg:leading-tight"
              >
                Shop groceries online without reading every label.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-stone-600">
                SafeSnack flags your allergens on Amazon Fresh, instantly. Free for your family.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <Link
                  href="/install"
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-accent px-5 py-3 text-center text-sm font-semibold text-accent-foreground shadow-sm transition-colors hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  Add to Chrome — free
                </Link>
              </div>
              <p className="mt-6 text-sm font-medium text-stone-500">
                Works on Amazon Fresh today. Instacart and Walmart coming soon.
              </p>
              <EmailCaptureForm variant="hero" />
            </div>
            <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
              <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg ring-1 ring-stone-900/5">
                <Image
                  src="/hero.png"
                  alt="Mock Amazon Fresh search results with red and green allergen badges on product tiles"
                  width={1200}
                  height={675}
                  priority
                  className="h-auto w-full object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              <p className="mt-3 text-center text-xs text-stone-500">
                Illustrative mockup. Always verify ingredients on product packaging.
              </p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section
          aria-labelledby="how-heading"
          className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20"
        >
          <h2
            id="how-heading"
            className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl"
          >
            How it works
          </h2>
          <ol className="mt-10 grid gap-8 sm:grid-cols-3">
            <li className="relative rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <span
                className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent"
                aria-hidden
              >
                1
              </span>
              <h3 className="text-lg font-semibold text-stone-900">
                Pick your allergens (30 sec setup)
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                Zero friction at the moment of need—onboarding stays under a minute, no login for
                MVP.
              </p>
            </li>
            <li className="relative rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <span
                className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent"
                aria-hidden
              >
                2
              </span>
              <h3 className="text-lg font-semibold text-stone-900">Shop Amazon Fresh normally</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                Browse search and category pages the way you already do; badges appear on tiles and
                detail views.
              </p>
            </li>
            <li className="relative rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <span
                className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent"
                aria-hidden
              >
                3
              </span>
              <h3 className="text-lg font-semibold text-stone-900">
                See red/green badges on every product
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                Safe, unsafe, and unknown are shown distinctly—&ldquo;may contain&rdquo; is not the
                same as &ldquo;contains.&rdquo;
              </p>
            </li>
          </ol>
        </section>

        {/* Why SafeSnack */}
        <section
          aria-labelledby="why-heading"
          className="border-y border-stone-200/80 bg-white py-16 sm:py-20"
        >
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h2
              id="why-heading"
              className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl"
            >
              Why SafeSnack
            </h2>
            <ul className="mt-10 grid gap-6 sm:grid-cols-2">
              <li className="flex gap-4 rounded-2xl border border-stone-200 bg-stone-50/50 p-5">
                <HeartHandshake className="h-8 w-8 shrink-0 text-accent" aria-hidden />
                <div>
                  <p className="font-semibold text-stone-900">
                    &ldquo;Built for families with food allergies&rdquo;
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">
                    Family is the unit, not a single account—shared protection as partners shop too.
                  </p>
                </div>
              </li>
              <li className="flex gap-4 rounded-2xl border border-stone-200 bg-stone-50/50 p-5">
                <ShieldAlert className="h-8 w-8 shrink-0 text-accent" aria-hidden />
                <div>
                  <p className="font-semibold text-stone-900">
                    &ldquo;Detects 10 major allergens including sesame&rdquo;
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">
                    Safety over slickness—when in doubt, Unknown with a clear path to verify.
                  </p>
                </div>
              </li>
              <li className="flex gap-4 rounded-2xl border border-stone-200 bg-stone-50/50 p-5">
                <Sparkles className="h-8 w-8 shrink-0 text-accent" aria-hidden />
                <div>
                  <p className="font-semibold text-stone-900">
                    &ldquo;Always-verify disclaimer — never claims to replace reading labels&rdquo;
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">
                    Honest about uncertainty and buyer trust over growth hacks—no false
                    &ldquo;safe&rdquo; guarantees.
                  </p>
                </div>
              </li>
              <li className="flex gap-4 rounded-2xl border border-stone-200 bg-stone-50/50 p-5">
                <Lock className="h-8 w-8 shrink-0 text-accent" aria-hidden />
                <div>
                  <p className="font-semibold text-stone-900">
                    &ldquo;Your data stays on your device&rdquo;
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">
                    MVP allergen preferences live in your browser profile (Chrome sync), not our
                    servers—minimal collection, no selling data.
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section
          aria-labelledby="faq-heading"
          className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20"
        >
          <h2
            id="faq-heading"
            className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl"
          >
            FAQ
          </h2>
          <div className="mt-8 flex flex-col gap-3">
            {faqItems.map((item) => (
              <details
                key={item.q}
                className="group rounded-xl border border-stone-200 bg-white shadow-sm open:shadow-md"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 text-left text-sm font-semibold text-stone-900 sm:text-base [&::-webkit-details-marker]:hidden">
                  <span>{item.q}</span>
                  <ChevronDown
                    className="h-5 w-5 shrink-0 text-stone-500 transition-transform duration-200 ease-out group-open:rotate-180 motion-reduce:transition-none"
                    aria-hidden
                  />
                </summary>
                <div className="border-t border-stone-100 px-4 pb-4 pt-2 text-sm leading-relaxed text-stone-600">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200 bg-stone-100/80">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <nav
            aria-label="Footer"
            className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-medium text-stone-700"
          >
            <Link
              href="/privacy"
              className="underline decoration-stone-400 underline-offset-2 transition-colors hover:text-accent"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="underline decoration-stone-400 underline-offset-2 transition-colors hover:text-accent"
            >
              Terms
            </Link>
            <a
              href="mailto:hello@safesnack.co"
              className="underline decoration-stone-400 underline-offset-2 transition-colors hover:text-accent"
            >
              Contact
            </a>
            {GITHUB_URL ? (
              <a
                href={GITHUB_URL}
                rel="noopener noreferrer"
                className="underline decoration-stone-400 underline-offset-2 transition-colors hover:text-accent"
              >
                GitHub
              </a>
            ) : null}
          </nav>
          <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed text-stone-600">
            SafeSnack is a convenience tool, not a medical device. Always verify ingredients on
            product packaging.
          </p>
        </div>
      </footer>
    </div>
  );
}
