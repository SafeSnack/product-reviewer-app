'use client';

import { type FormEvent, useId, useState } from 'react';

const FORM_ACTION = process.env.NEXT_PUBLIC_EMAIL_FORM_ACTION_URL?.trim() ?? '';
const ENTRY_KEY = process.env.NEXT_PUBLIC_EMAIL_FORM_ENTRY_KEY?.trim() ?? '';

const THANKS = "Thanks — we'll email you when SafeSnack is ready." as const;

function submitToGoogleForm(actionUrl: string, entryKey: string, email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const iframe = document.createElement('iframe');
      iframe.name = `email_capture_${Date.now()}`;
      iframe.setAttribute('aria-hidden', 'true');
      iframe.style.cssText = 'position:absolute;width:0;height:0;border:0;overflow:hidden';
      iframe.title = 'Form submission';
      document.body.appendChild(iframe);

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = actionUrl;
      form.target = iframe.name;
      form.acceptCharset = 'UTF-8';

      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = entryKey;
      input.value = email;
      form.appendChild(input);

      document.body.appendChild(form);
      form.submit();

      window.setTimeout(() => {
        form.remove();
        iframe.remove();
        resolve();
      }, 800);
    } catch (e) {
      reject(e);
    }
  });
}

type EmailCaptureFormProps = {
  /** Hero: inline row. Install: card. */
  variant: 'hero' | 'install';
};

export function EmailCaptureForm({ variant }: EmailCaptureFormProps) {
  const formId = useId();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const configured = FORM_ACTION.length > 0 && ENTRY_KEY.length > 0;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      return;
    }
    if (!configured) {
      return;
    }

    setStatus('submitting');
    setErrorMessage('');
    try {
      await submitToGoogleForm(FORM_ACTION, ENTRY_KEY, trimmed);
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
      setErrorMessage('Something went wrong. Please try again.');
    }
  }

  const isHero = variant === 'hero';
  const wrapperClass = isHero
    ? 'mt-8 max-w-xl rounded-xl border border-stone-200 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5'
    : 'mx-auto mt-10 max-w-md rounded-2xl border border-stone-200 bg-white p-6 text-left shadow-sm';

  return (
    <div className={wrapperClass}>
      <p className={`font-medium text-stone-900 ${isHero ? 'text-sm' : 'text-base'}`}>
        Get launch updates
      </p>
      <p className={`mt-1 text-stone-600 ${isHero ? 'text-xs' : 'text-sm'}`}>
        {isHero
          ? 'Optional waitlist — separate from Add to Chrome; no account required.'
          : "We'll email you when the Chrome Web Store listing is live."}
      </p>

      {status === 'success' ? (
        <p
          className={`mt-4 font-medium text-accent ${isHero ? 'text-sm' : 'text-base'}`}
          role="status"
          aria-live="polite"
        >
          {THANKS}
        </p>
      ) : (
        <form onSubmit={(ev) => void onSubmit(ev)} className="mt-4" noValidate>
          <label htmlFor={formId} className="sr-only">
            Email for launch updates
          </label>
          <div
            className={
              isHero
                ? 'flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-2'
                : 'flex flex-col gap-2'
            }
          >
            <input
              id={formId}
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              disabled={status === 'submitting'}
              className={`min-h-[44px] w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none ring-accent focus:border-accent focus:ring-2 disabled:bg-stone-100 ${isHero ? 'text-sm' : ''}`}
              placeholder="you@example.com"
            />
            <button
              type="submit"
              disabled={status === 'submitting' || !configured}
              className={`min-h-[44px] shrink-0 rounded-lg border border-stone-300 bg-stone-50 px-4 py-2 text-sm font-semibold text-stone-900 transition-colors hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 ${isHero ? 'sm:w-auto' : ''}`}
            >
              {status === 'submitting' ? 'Sending…' : 'Notify me'}
            </button>
          </div>
          {!configured ? (
            <p className="mt-2 text-xs text-stone-500">
              {process.env.NODE_ENV === 'development' ? (
                <>
                  Set{' '}
                  <code className="rounded bg-stone-100 px-1">
                    NEXT_PUBLIC_EMAIL_FORM_ACTION_URL
                  </code>{' '}
                  and{' '}
                  <code className="rounded bg-stone-100 px-1">
                    NEXT_PUBLIC_EMAIL_FORM_ENTRY_KEY
                  </code>{' '}
                  (Google Form <code className="rounded bg-stone-100 px-1">formResponse</code> URL +
                  field <code className="rounded bg-stone-100 px-1">entry.…</code>).
                </>
              ) : (
                'Email signup is not available yet.'
              )}
            </p>
          ) : (
            <p className="mt-2 text-xs text-stone-500">
              Sends to our waitlist form. You can still install anytime.
            </p>
          )}
          {status === 'error' && errorMessage ? (
            <p className="mt-2 text-sm text-red-800" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </form>
      )}
    </div>
  );
}
