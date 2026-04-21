import type { Metadata } from 'next';

import { LegalLayout } from '../components/LegalLayout';

export const metadata: Metadata = {
  title: 'Terms',
  description: 'SafeSnack terms of service — license, disclaimers, and limitations.',
};

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of service">
      <div
        className="rounded-xl border-2 border-stone-800 bg-stone-900 px-4 py-5 text-center sm:px-6"
        role="region"
        aria-label="Important disclaimer"
      >
        <p className="text-base font-bold leading-snug text-white sm:text-lg">
          SafeSnack is a convenience tool, not a medical device. Always verify ingredients on
          product packaging. We are not liable for missed allergens, allergic reactions, or any
          health-related outcomes.
        </p>
      </div>

      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the SafeSnack
        website and Chrome extension (the &ldquo;Services&rdquo;). By installing or using the
        Services, you agree to these Terms.
      </p>

      <section className="space-y-3" aria-labelledby="eligibility-heading">
        <h2 id="eligibility-heading" className="text-xl font-semibold text-stone-900">
          Eligibility and account
        </h2>
        <p>
          You must be able to form a binding contract in your jurisdiction. The MVP does not require
          an account. If we introduce accounts in a future version, additional terms may apply at
          registration.
        </p>
      </section>

      <section className="space-y-3" aria-labelledby="license-heading">
        <h2 id="license-heading" className="text-xl font-semibold text-stone-900">
          License to use
        </h2>
        <p>
          Subject to these Terms, we grant you a personal, non-exclusive, non-transferable,
          revocable license to install and use the extension and access the website for your own
          household or personal shopping — not for resale, scraping of our Services to build a
          competing product, or redistribution without permission.
        </p>
      </section>

      <section className="space-y-3" aria-labelledby="prohibited-heading">
        <h2 id="prohibited-heading" className="text-xl font-semibold text-stone-900">
          Prohibited use
        </h2>
        <p>You agree not to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Use the Services in violation of applicable law or third-party rights.</li>
          <li>
            Interfere with or disrupt the Services, servers, or networks, or circumvent technical
            limits.
          </li>
          <li>
            Reverse engineer or decompile the extension except where applicable law expressly
            permits despite this limitation.
          </li>
          <li>
            Rely on the Services as a substitute for reading product labels, medical advice, or
            professional allergy management.
          </li>
        </ul>
      </section>

      <section className="space-y-3" aria-labelledby="ip-heading">
        <h2 id="ip-heading" className="text-xl font-semibold text-stone-900">
          Intellectual property
        </h2>
        <p>
          The Services, including software, branding, and content we provide, are owned by SafeSnack
          or its licensors and are protected by intellectual property laws. Except for the limited
          license above, no rights are granted to you.
        </p>
      </section>

      <section className="space-y-3" aria-labelledby="warranty-heading">
        <h2 id="warranty-heading" className="text-xl font-semibold text-stone-900">
          Disclaimer of warranties
        </h2>
        <p>
          THE SERVICES ARE PROVIDED <strong>&ldquo;AS IS&rdquo;</strong> AND{' '}
          <strong>&ldquo;AS AVAILABLE.&rdquo;</strong> TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE
          DISCLAIM ALL WARRANTIES, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING IMPLIED
          WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND
          NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICES WILL BE ERROR-FREE, COMPLETE, OR
          THAT INGREDIENT OR ALLERGEN INFORMATION WILL BE ACCURATE OR UP TO DATE.
        </p>
      </section>

      <section className="space-y-3" aria-labelledby="liability-heading">
        <h2 id="liability-heading" className="text-xl font-semibold text-stone-900">
          Limitation of liability
        </h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT WILL SAFESNACK OR ITS AFFILIATES,
          OFFICERS, DIRECTORS, EMPLOYEES, OR SUPPLIERS BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
          SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA,
          GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING FROM OR RELATED TO YOUR USE OF THE SERVICES.
        </p>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR TOTAL LIABILITY FOR ANY CLAIM ARISING OUT OF
          OR RELATING TO THE SERVICES SHALL NOT EXCEED THE GREATER OF{' '}
          <strong>(A) ZERO U.S. DOLLARS</strong> OR{' '}
          <strong>
            (B) THE TOTAL AMOUNT YOU PAID SAFESNACK FOR THE SERVICES IN THE TWELVE (12) MONTHS
            PRECEDING THE EVENT GIVING RISE TO THE CLAIM
          </strong>
          . BECAUSE THE MVP IS OFFERED WITHOUT CHARGE, THAT AMOUNT MAY BE ZERO.
        </p>
        <p>
          Some jurisdictions do not allow certain limitations; in those cases, our liability is
          limited to the fullest extent permitted by law.
        </p>
      </section>

      <section className="space-y-3" aria-labelledby="law-heading">
        <h2 id="law-heading" className="text-xl font-semibold text-stone-900">
          Governing law
        </h2>
        <p>
          These Terms are governed by the laws of the{' '}
          <strong>State of Delaware, United States</strong>, without regard to conflict-of-law rules
          that would require application of another jurisdiction&apos;s laws, except that mandatory
          consumer protections in your country of residence may still apply where required.
        </p>
      </section>

      <section className="space-y-3" aria-labelledby="termination-heading">
        <h2 id="termination-heading" className="text-xl font-semibold text-stone-900">
          Termination
        </h2>
        <p>
          You may stop using the Services at any time by uninstalling the extension and ceasing use
          of the website. We may suspend or terminate access to the Services if we reasonably
          believe you have violated these Terms or if we discontinue the Services.
        </p>
      </section>

      <section className="space-y-3" aria-labelledby="terms-changes-heading">
        <h2 id="terms-changes-heading" className="text-xl font-semibold text-stone-900">
          Changes to these Terms
        </h2>
        <p>
          We may modify these Terms from time to time. We will post the updated Terms on this page
          and update the &ldquo;Last updated&rdquo; date. If you continue to use the Services after
          changes become effective, you accept the revised Terms. If you do not agree, stop using
          the Services.
        </p>
      </section>

      <section className="space-y-3" aria-labelledby="terms-contact-heading">
        <h2 id="terms-contact-heading" className="text-xl font-semibold text-stone-900">
          Contact
        </h2>
        <p>
          Questions about these Terms:{' '}
          <a
            className="font-semibold text-accent underline decoration-green-700/40 underline-offset-2 hover:text-green-800"
            href="mailto:hello@safesnack.co"
          >
            hello@safesnack.co
          </a>
        </p>
      </section>
    </LegalLayout>
  );
}
