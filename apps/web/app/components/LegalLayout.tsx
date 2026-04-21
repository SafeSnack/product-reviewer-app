import type { ReactNode } from 'react';
import Link from 'next/link';

/** Display string shown on legal pages (update when policy text changes). */
export const LEGAL_LAST_UPDATED_LABEL = 'April 21, 2026';

type LegalLayoutProps = {
  title: string;
  children: ReactNode;
};

export function LegalLayout({ title, children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200/80 bg-stone-50/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-lg font-semibold tracking-tight text-stone-900">
            SafeSnack
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-accent transition-colors hover:text-green-700"
          >
            Home
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900">{title}</h1>
        <p className="mt-2 text-sm text-stone-500">Last updated: {LEGAL_LAST_UPDATED_LABEL}</p>
        <div className="mt-10 max-w-none space-y-8 text-base leading-relaxed text-stone-700">
          {children}
        </div>
      </div>
    </div>
  );
}
