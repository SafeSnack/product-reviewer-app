import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';

import { OpeningSoonForm } from './opening-soon-form';

export const metadata: Metadata = {
  title: 'Install',
  description: 'Install SafeSnack from the Chrome Web Store.',
};

export default function InstallPage() {
  const storeUrl = process.env.NEXT_PUBLIC_CHROME_WEBSTORE_URL?.trim();
  if (storeUrl) {
    redirect(storeUrl);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <Link href="/" className="text-sm font-medium text-accent hover:text-green-700">
        ← Home
      </Link>
      <h1 className="mt-8 text-3xl font-bold tracking-tight text-stone-900">Opening soon</h1>
      <p className="mt-4 text-stone-600">
        SafeSnack is not yet listed on the Chrome Web Store. Leave your email and we will follow up
        when the listing is live.
      </p>
      <OpeningSoonForm />
    </div>
  );
}
