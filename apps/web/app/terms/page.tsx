import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms',
  description: 'SafeSnack terms of service.',
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/" className="text-sm font-medium text-accent hover:text-green-700">
        ← Home
      </Link>
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-stone-900">Terms of service</h1>
      <p className="mt-2 text-sm text-stone-500">Last updated: April 2026</p>

      <div className="mt-10 max-w-none space-y-6 text-stone-700">
        <p>
          These terms govern use of SafeSnack websites and the Chrome extension. This is scaffold
          copy — replace with counsel-reviewed terms before public launch.
        </p>
        <section>
          <h2 className="text-xl font-semibold text-stone-900">Not medical advice</h2>
          <p className="mt-2">
            SafeSnack is a software assistant. It can make mistakes. Ingredient data may be wrong,
            incomplete, or out of date. <strong>Always verify packaging</strong> and consult a
            qualified professional for medical decisions.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-stone-900">Acceptable use</h2>
          <p className="mt-2">
            Do not misuse the extension to interfere with third-party sites beyond normal personal
            browsing automation, or to violate applicable law or site terms.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-stone-900">Contact</h2>
          <p className="mt-2">
            <a
              className="font-medium text-accent hover:text-green-700"
              href="mailto:hello@safesnack.co"
            >
              hello@safesnack.co
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
