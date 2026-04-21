import type { Metadata } from 'next';

import { LegalLayout } from '../components/LegalLayout';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'SafeSnack privacy policy — what we collect, what we do not, and your rights.',
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy policy">
      <p>
        This Privacy Policy describes how SafeSnack (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or
        &ldquo;our&rdquo;) handles information when you use our website at safesnack.co and the
        SafeSnack Chrome extension (together, the &ldquo;Services&rdquo;). If you do not agree,
        please do not use the Services.
      </p>

      <section className="space-y-3" aria-labelledby="collect-heading">
        <h2 id="collect-heading" className="text-xl font-semibold text-stone-900">
          What we collect
        </h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Allergen preferences and extension settings</strong> — stored locally in your
            browser using Chrome&apos;s sync storage where available. We do not receive this data on
            our servers in the MVP.
          </li>
          <li>
            <strong>Email address</strong> — only if you create an account in a future version
            (v2+). The MVP does not require an account and does not collect email for core use.
          </li>
          <li>
            <strong>Anonymized usage counters</strong> — in the MVP, simple counters (for example,
            scans in the current session) are stored only in{' '}
            <strong>local browser session storage</strong>. They are not sent to third-party
            analytics products in the MVP build.
          </li>
        </ul>
      </section>

      <section className="space-y-3" aria-labelledby="not-collect-heading">
        <h2 id="not-collect-heading" className="text-xl font-semibold text-stone-900">
          What we do not collect (MVP)
        </h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Browsing history</strong> beyond what your browser already does for normal
            operation. We do not build or store a history of non-grocery sites you visit.
          </li>
          <li>
            <strong>Purchase data</strong> — we do not collect order IDs, receipts, cart contents,
            or payment information through the MVP extension.
          </li>
          <li>
            <strong>Personally identifying information</strong> (such as name, postal address, or
            phone number) for MVP core features.
          </li>
          <li>
            <strong>Health data</strong> beyond the allergen flags you explicitly choose in
            settings. We do not request diagnoses or medical records.
          </li>
        </ul>
      </section>

      <section className="space-y-3" aria-labelledby="third-parties-heading">
        <h2 id="third-parties-heading" className="text-xl font-semibold text-stone-900">
          Third parties and product data
        </h2>
        <p>
          When the extension requests public product or ingredient data, it may contact{' '}
          <strong>Open Food Facts</strong> (or similar public databases) for{' '}
          <strong>lookups only</strong>. Requests are made for product identifiers or search terms
          needed to retrieve ingredient information. We do <strong>not</strong> attach your name,
          email, or a persistent SafeSnack user ID to those requests in the MVP.
        </p>
        <p>
          <strong>Analytics:</strong> the MVP does not load third-party advertising or marketing
          analytics scripts in the extension. Session counters stay on your device as described
          above. If optional remote analytics are introduced later, we will describe them here and
          provide controls consistent with our product principles.
        </p>
      </section>

      <section className="space-y-3" aria-labelledby="retention-heading">
        <h2 id="retention-heading" className="text-xl font-semibold text-stone-900">
          Storage, retention, and deletion
        </h2>
        <p>
          For the MVP, allergen preferences and related settings reside in{' '}
          <strong>your browser</strong> (Chrome sync storage). Usage counters for the current
          session reside in <strong>session storage</strong> and reset when the session ends or data
          is cleared.
        </p>
        <p>
          <strong>Clearing extension data</strong> (for example, removing the extension or clearing
          site data / extension storage in Chrome){' '}
          <strong>removes locally stored SafeSnack data</strong> on that installation. We do not
          maintain a separate copy on our servers for MVP-only local features.
        </p>
      </section>

      <section className="space-y-3" aria-labelledby="rights-heading">
        <h2 id="rights-heading" className="text-xl font-semibold text-stone-900">
          Your privacy rights (GDPR &amp; CCPA)
        </h2>
        <p>
          Depending on where you live, you may have rights under the EU/UK General Data Protection
          Regulation (<strong>GDPR</strong>) and the California Consumer Privacy Act, as amended (
          <strong>CCPA/CPRA</strong>), among others.
        </p>
        <p>
          <strong>GDPR (EEA/UK):</strong> Where applicable, we process information to operate and
          improve the Services and to meet legal obligations. You may have the right to access,
          rectify, erase, restrict, or object to certain processing, and to data portability. You
          may lodge a complaint with your local supervisory authority.
        </p>
        <p>
          <strong>CCPA/CPRA (California):</strong> California residents may have the right to know
          what personal information is collected, to request deletion of personal information we
          hold (subject to exceptions), to correct inaccurate information, and to opt out of certain
          types of sharing. We <strong>do not sell</strong> personal information as that term is
          commonly understood. We will not discriminate against you for exercising these rights.
        </p>
        <p>
          To exercise rights that apply to information we hold about you (for example, after you
          create an account in a future version), contact us at the email below. For purely
          local-only MVP data, you can also use browser and extension controls to delete data
          directly on your device.
        </p>
      </section>

      <section className="space-y-3" aria-labelledby="children-heading">
        <h2 id="children-heading" className="text-xl font-semibold text-stone-900">
          Children
        </h2>
        <p>
          The Services are not directed to children under 13, and we do not knowingly collect
          personal information from children under 13. If you believe we have collected such
          information, contact us and we will take appropriate steps.
        </p>
      </section>

      <section className="space-y-3" aria-labelledby="changes-heading">
        <h2 id="changes-heading" className="text-xl font-semibold text-stone-900">
          Changes to this policy
        </h2>
        <p>
          We may update this Privacy Policy from time to time. We will post the updated version on
          this page and revise the &ldquo;Last updated&rdquo; date. Material changes will be called
          out when required by law or when we reasonably can (for example, via the extension or
          website).
        </p>
      </section>

      <section className="space-y-3" aria-labelledby="contact-heading">
        <h2 id="contact-heading" className="text-xl font-semibold text-stone-900">
          Contact
        </h2>
        <p>
          Privacy questions and requests:{' '}
          <a
            className="font-semibold text-accent underline decoration-green-700/40 underline-offset-2 hover:text-green-800"
            href="mailto:privacy@safesnack.co"
          >
            privacy@safesnack.co
          </a>
        </p>
      </section>

      <p className="border-t border-stone-200 pt-6 text-sm text-stone-500">
        This policy is written to reflect the current MVP design. It is not a substitute for legal
        advice; consider independent review before wide distribution.
      </p>
    </LegalLayout>
  );
}
