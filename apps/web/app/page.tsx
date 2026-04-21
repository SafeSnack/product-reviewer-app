import { Leaf, ShieldCheck, Store } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-stone-200/80 bg-stone-50/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-semibold tracking-tight text-stone-900">
            SafeSnack
          </Link>
          <nav className="flex gap-4 text-sm font-medium text-stone-600">
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

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Amazon Fresh</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
          Shop groceries online without reading every label.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-stone-600">
          SafeSnack flags your allergens in real time on supported grocery pages. Always verify
          packaging — ingredient data can be incomplete or change.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/install"
            className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground shadow-sm transition-colors hover:bg-green-700"
          >
            Get the extension
          </Link>
          <a
            href="mailto:hello@safesnack.co"
            className="inline-flex items-center justify-center rounded-lg border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-800 transition-colors hover:border-stone-400"
          >
            Contact
          </a>
        </div>

        <ul className="mt-20 grid gap-8 sm:grid-cols-3">
          <li className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <ShieldCheck className="h-9 w-9 text-accent" aria-hidden />
            <h2 className="mt-4 text-lg font-semibold text-stone-900">Bias to unknown</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">
              When confidence is low, we show unknown — not a risky “safe.”
            </p>
          </li>
          <li className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <Store className="h-9 w-9 text-accent" aria-hidden />
            <h2 className="mt-4 text-lg font-semibold text-stone-900">Built for grocery</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">
              Start with Amazon Fresh; more surfaces can follow.
            </p>
          </li>
          <li className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <Leaf className="h-9 w-9 text-accent" aria-hidden />
            <h2 className="mt-4 text-lg font-semibold text-stone-900">Privacy-minded MVP</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">
              Local-first settings; no browsing history shipped for core detection.
            </p>
          </li>
        </ul>
      </main>

      <footer className="border-t border-stone-200 py-8 text-center text-xs text-stone-500">
        <p>Always verify packaging.</p>
        <p className="mt-2">
          <Link
            href="/privacy"
            className="underline decoration-stone-400 underline-offset-2 hover:text-accent"
          >
            Privacy
          </Link>
          {' · '}
          <Link
            href="/terms"
            className="underline decoration-stone-400 underline-offset-2 hover:text-accent"
          >
            Terms
          </Link>
        </p>
      </footer>
    </div>
  );
}
