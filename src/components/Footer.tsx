import Link from "next/link";
import { Lock, ShieldCheck } from "lucide-react";
import { Logo } from "./ui";

export default function Footer() {
  return (
    <footer className="no-print mt-20 bg-navy-950 text-navy-100">
      <div className="container-x grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Logo light />
          <p className="text-sm text-navy-200">One account for the services of the Republic of Liberia - apply, pay and verify from wherever you are.</p>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">Citizens</h3>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-white" href="/services">Browse services</Link></li>
            <li><Link className="hover:text-white" href="/track">Track an application</Link></li>
            <li><Link className="hover:text-white" href="/verify">Verify a certificate</Link></li>
            <li><Link className="hover:text-white" href="/register">Create an account</Link></li>
            <li><Link className="hover:text-white" href="/ussd">Use a basic phone (USSD)</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">Government</h3>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-white" href="/login">Officer sign-in</Link></li>
            <li><Link className="hover:text-white" href="/staff">Staff desk</Link></li>
          </ul>
        </div>
        <div className="space-y-3 text-sm">
          <h3 className="text-sm font-semibold text-white">Your data is protected</h3>
          <p className="flex gap-2 text-navy-200"><Lock size={16} className="mt-0.5 shrink-0" /> Encrypted connection, account lockout and session controls.</p>
          <p className="flex gap-2 text-navy-200"><ShieldCheck size={16} className="mt-0.5 shrink-0" /> Certificates are digitally signed and publicly verifiable.</p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-2 py-5 text-xs text-navy-200 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} eLiberia · Built by Global Impact Innovators</span>
          <span>Pilot build - fees and processing times are illustrative until confirmed by each agency.</span>
        </div>
      </div>
    </footer>
  );
}
