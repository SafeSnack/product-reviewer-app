'use client';

import { type FormEvent, useState } from 'react';

const NOTIFY_SUBJECT = 'SafeSnack — Chrome Web Store notify me';

export function OpeningSoonForm() {
  const [email, setEmail] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      return;
    }
    const body = `Please notify me when the SafeSnack extension is live on the Chrome Web Store.\n\nEmail: ${trimmed}\n`;
    window.location.href = `mailto:hello@safesnack.co?subject=${encodeURIComponent(NOTIFY_SUBJECT)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <form
      onSubmit={submit}
      className="mx-auto mt-10 max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
    >
      <label htmlFor="notify-email" className="block text-sm font-medium text-stone-800">
        Email for launch notification
      </label>
      <input
        id="notify-email"
        name="email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(ev) => setEmail(ev.target.value)}
        className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none ring-accent focus:border-accent focus:ring-2"
        placeholder="you@example.com"
      />
      <p className="mt-2 text-xs text-stone-500">
        Opens your mail app with a pre-filled message. No server storage in this MVP flow.
      </p>
      <button
        type="submit"
        className="mt-4 w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-green-700"
      >
        Request notification
      </button>
    </form>
  );
}
