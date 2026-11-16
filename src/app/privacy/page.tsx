import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = { title: "Privacy notice" };

export default function Privacy() {
  return (
    <LegalPage title="Privacy notice" updated="2026-11-draft">
      <p>eLiberia is a single place to apply for government services. This notice explains what we collect, why, who can see it, and what you can do about it.</p>
      <h2>What we collect</h2>
      <ul>
        <li>Your account details: name, phone number, and optionally email, date of birth, county and identity document number.</li>
        <li>What you submit for each service: the answers the institution asks for and the documents you upload.</li>
        <li>Identity checks: selfies taken for face verification, with liveness and match scores.</li>
        <li>Payments: the amount, method, and the provider&apos;s reference. We never see your mobile money PIN or card number.</li>
        <li>Security records: sign-ins, devices&apos; network addresses, and actions taken on your account.</li>
      </ul>
      <h2>Why we use it</h2>
      <p>Only to process the services you apply for, to verify your identity, to take payment, to keep your account secure, and to meet legal record-keeping duties. We do not sell your data or use it for advertising.</p>
      <h2>Who can see it</h2>
      <ul>
        <li>Officers of the institution that handles your application, and only for that application.</li>
        <li>An agent you chose, for two hours after you gave them your consent code.</li>
        <li>A small number of eLiberia support staff, when needed to help you. Every time an official opens your application it is recorded and shown to you.</li>
      </ul>
      <h2>How we protect it</h2>
      <p>Your answers, documents and photos are encrypted when stored. Staff accounts need a second sign-in code. Accounts lock after repeated wrong passwords.</p>
      <h2>How long we keep it</h2>
      <ul>
        <li>Unfinished draft applications are deleted after 90 days without changes, unless you paid for them.</li>
        <li>In-app notifications are deleted after one year.</li>
        <li>Submitted applications and certificates are kept for as long as the issuing institution is required to keep its records.</li>
      </ul>
      <h2>Your choices</h2>
      <ul>
        <li>Download everything we hold about you from <b>Account &amp; security</b>.</li>
        <li>Correct your details on your profile, or ask the institution through the application&apos;s messages.</li>
        <li>Remove saved documents and family members at any time.</li>
      </ul>
      <h2>Contact</h2>
      <p>Questions about your data: use the message thread on any application, or contact the eLiberia team. Contact details will be published before launch.</p>
    </LegalPage>
  );
}
