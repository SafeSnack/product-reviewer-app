import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'SafeSnack privacy policy.',
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/" className="text-sm font-medium text-accent hover:text-green-700">
        ← Home
      </Link>
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-stone-900">Privacy policy</h1>
      <p className="mt-2 text-sm text-stone-500">Last updated: April 2026</p>

      <div className="mt-10 max-w-none space-y-6 text-stone-700">
        <p>
          This page describes how SafeSnack handles information when you use the website and Chrome
          extension. It is a scaffold for launch — replace with counsel-reviewed text before
          shipping.
        </p>
        <section>
          <h2 className="text-xl font-semibold text-stone-900">What we collect</h2>
          <p className="mt-2">
            The MVP extension stores your allergen profile and related settings in{' '}
            <strong>Chrome sync storage</strong> on your devices. Detection uses on-page product
            data (for example, ingredient text visible on Amazon) and optional lookups to public
            nutrition databases where enabled.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-stone-900">What we do not do (MVP)</h2>
          <p className="mt-2">
            We do not sell your data. We do not run third-party advertising analytics in the MVP
            extension build. Optional product analytics may be offered later with explicit opt-in.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-stone-900">Contact</h2>
          <p className="mt-2">
            Questions:{' '}
            <a
              className="font-medium text-accent hover:text-green-700"
              href="mailto:hello@safesnack.co"
            >
              hello@safesnack.co
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
