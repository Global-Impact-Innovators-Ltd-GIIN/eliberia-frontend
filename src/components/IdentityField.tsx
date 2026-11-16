"use client";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { Field } from "@/lib/api";
import { cleanNumber, identityState, IdentityMeta } from "@/lib/identity";

/**
 * Nationality -> document type -> number. The number box only accepts what that country's document
 * looks like: choosing United States + Passport means only a US passport number is accepted.
 */
export default function IdentityField({ field: f, data, meta, onChange, disabled }: {
  field: Field; data: Record<string, string>; meta: IdentityMeta | null; disabled?: boolean;
  onChange: (patch: Record<string, string>) => void;
}) {
  const s = identityState(f, data, meta);
  const pickCountry = s.countries.length !== 1;
  const pickDoc = s.docs.length !== 1;
  const list = (meta?.countries || []).filter((c) => !s.countries.length || s.countries.includes(c.code));
  const ready = !!s.country && !!s.doc;

  const setCountry = (code: string) => {
    const patch: Record<string, string> = { [`${f.name}__country`]: code, [f.name]: "" };
    if (code !== s.home && (data[`${f.name}__doc`] || "") === "National ID") patch[`${f.name}__doc`] = s.docs.includes("Passport") ? "Passport" : "";
    onChange(patch);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 sm:col-span-2">
      <div className="grid gap-3 sm:grid-cols-2">
        {pickCountry && (
          <div>
            <label className="label" htmlFor={`${f.name}-c`}>Nationality</label>
            <select id={`${f.name}-c`} className="input" disabled={disabled} value={s.country} onChange={(e) => setCountry(e.target.value)}>
              <option value="">Select country…</option>
              {list.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </div>
        )}
        {pickDoc && (
          <div>
            <span className="label">Document type</span>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Document type">
              {s.docs.map((d) => {
                const blocked = d === "National ID" && !!s.country && s.country !== s.home;
                return (
                  <button key={d} type="button" role="radio" aria-checked={s.doc === d} disabled={disabled || blocked}
                    title={blocked ? "Only Liberian nationals can use a Liberian National ID" : undefined}
                    onClick={() => onChange({ [`${f.name}__doc`]: d, [f.name]: "" })}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${s.doc === d ? "border-navy-800 bg-navy-50 text-navy-800" : "border-ink-300 bg-white text-ink-700 hover:border-navy-400"} disabled:cursor-not-allowed disabled:opacity-40`}>
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div className={pickCountry !== pickDoc ? "" : "sm:col-span-2"}>
          <label className="label" htmlFor={f.name}>
            {s.doc ? `${s.doc === "Passport" && s.countryName ? `${s.countryName} passport` : s.doc} number` : "Document number"}
            {f.required && <span className="text-flag-600"> *</span>}
          </label>
          <div className="relative">
            <input id={f.name} className={`input pr-10 font-mono uppercase tracking-wide ${s.number && ready ? (s.valid ? "!border-emerald-500" : "!border-flag-500") : ""}`}
              disabled={disabled || !ready} value={data[f.name] || ""} autoComplete="off" spellCheck={false}
              placeholder={ready ? s.rule?.example : "Choose nationality and document type first"}
              maxLength={20} onChange={(e) => onChange({ [f.name]: cleanNumber(e.target.value) })} aria-describedby={`${f.name}-hint`} />
            {s.number && ready && (s.valid
              ? <CheckCircle2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600" />
              : <CircleAlert size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-flag-600" />)}
          </div>
        </div>
      </div>
      <p id={`${f.name}-hint`} className={`mt-2 text-xs ${s.number && ready && !s.valid ? "font-medium text-flag-700" : "text-ink-500"}`}>
        {!s.country && pickCountry ? "Start by choosing the nationality shown on the document."
          : s.country && s.country !== s.home && pickDoc && !s.doc ? `${s.countryName} nationals must use a passport.`
          : s.rule ? `Format: ${s.rule.format}. Example: ${s.rule.example}`
          : f.help || "Enter the number exactly as printed on the document."}
      </p>
    </div>
  );
}
