import { FileWarning } from "lucide-react";

export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="container-x py-10">
      <article className="mx-auto max-w-3xl">
        <div className="alert alert-warn mb-6"><FileWarning size={18} className="mt-0.5 shrink-0" />
          <span><b>Draft for legal review.</b> This text was prepared for the pilot and must be reviewed by counsel and the relevant Liberian authorities before public launch.</span></div>
        <h1 className="text-3xl font-extrabold">{title}</h1>
        <p className="muted mt-1">Version {updated}</p>
        <div className="mt-6 space-y-5 leading-relaxed text-ink-700 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-ink-900 [&_li]:ml-5 [&_li]:list-disc">{children}</div>
      </article>
    </div>
  );
}
