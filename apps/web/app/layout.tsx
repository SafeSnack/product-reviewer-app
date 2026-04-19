import type { ReactNode } from 'react';

import './globals.css';

export const metadata = {
  title: 'SafeSnack',
  description: 'Allergy-aware grocery browsing.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
