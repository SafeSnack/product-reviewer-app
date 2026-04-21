import type { ReactNode } from 'react';
import { Analytics } from '@vercel/analytics/react';

import './globals.css';

export const metadata = {
  title: {
    default: 'SafeSnack',
    template: '%s · SafeSnack',
  },
  description: 'Allergy-aware grocery browsing for Amazon Fresh.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 font-sans text-stone-900 antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
