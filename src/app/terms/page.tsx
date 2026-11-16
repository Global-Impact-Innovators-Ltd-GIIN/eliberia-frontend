import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = { title: "Terms of use" };

export default function Terms() {
  return (
    <LegalPage title="Terms of use" updated="2026-11-draft">
      <p>By creating an account you agree to these terms. Each service is provided by the government institution named on it; eLiberia is the platform you use to reach them.</p>
      <h2>Your account</h2>
      <ul>
        <li>Use your own phone number and keep your password and one-time codes private. Nobody from eLiberia or an agency will ask for them.</li>
        <li>Give a consent code to an agent only when you are with them and want their help.</li>
        <li>You are responsible for what is submitted from your account.</li>
      </ul>
      <h2>What you submit</h2>
      <ul>
        <li>Information and documents must be true and your own, or those of someone you are legally allowed to act for.</li>
        <li>Submitting false information or forged documents may be a criminal offence and leads to rejection and possible referral to the authorities.</li>
      </ul>
      <h2>Fees and payments</h2>
      <ul>
        <li>Fees are set by each institution and shown before you pay. Payment does not guarantee approval.</li>
        <li>Refunds follow the institution&apos;s rules, for example when you paid twice by mistake.</li>
      </ul>
      <h2>Decisions and documents</h2>
      <ul>
        <li>The institution decides every application. Processing times are estimates.</li>
        <li>Certificates issued here carry a QR code and can be checked by anyone. A certificate can be revoked if it was issued in error or on false information.</li>
      </ul>
      <h2>Availability</h2>
      <p>We work to keep the service available but cannot promise it will never be interrupted. Your applications and documents are kept safe during interruptions.</p>
      <h2>Changes</h2>
      <p>We will tell you about important changes to these terms before they take effect.</p>
    </LegalPage>
  );
}
