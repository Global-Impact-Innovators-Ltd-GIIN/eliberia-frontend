"use client";
import { useEffect, useState } from "react";
import { api, Field } from "./api";

type Rule = { pattern: string; format: string; example: string };
export type IdentityMeta = {
  home: string; doc_types: string[]; countries: { code: string; name: string }[];
  passport: Record<string, Rule>; passport_default: Rule; national_id: Record<string, Rule>;
};

let cache: Promise<IdentityMeta> | null = null;
export function loadIdentityMeta() {
  if (!cache) cache = api<IdentityMeta>("/api/meta/identity").catch((e) => { cache = null; throw e; });
  return cache;
}
export function useIdentityMeta() {
  const [meta, setMeta] = useState<IdentityMeta | null>(null);
  useEffect(() => { loadIdentityMeta().then(setMeta).catch(() => {}); }, []);
  return meta;
}

export const cleanNumber = (v: string) => v.replace(/[\s\-./]/g, "").toUpperCase();

/** The choices that apply to an identity question once the institution's restrictions are applied. */
export function identityState(f: Field, data: Record<string, string>, meta: IdentityMeta | null) {
  const countries = f.countries || [];
  const docs = f.doc_types?.length ? f.doc_types : meta?.doc_types || ["National ID", "Passport"];
  const country = countries.length === 1 ? countries[0] : data[`${f.name}__country`] || "";
  let doc = docs.length === 1 ? docs[0] : data[`${f.name}__doc`] || "";
  const home = meta?.home || "LR";
  if (doc === "National ID" && country && country !== home) doc = "";
  const rule: Rule | null = !meta || !country || !doc ? null
    : doc === "National ID" ? meta.national_id[country] || null : meta.passport[country] || meta.passport_default;
  const number = cleanNumber(data[f.name] || "");
  const valid = !!rule && new RegExp(`^${rule.pattern}$`).test(number);
  const countryName = meta?.countries.find((c) => c.code === country)?.name || country;
  return { countries, docs, country, doc, rule, number, valid, countryName, home };
}

/** What to show for an answer on review screens. */
export function displayAnswer(f: Field, data: Record<string, string>, meta: IdentityMeta | null) {
  if (f.type === "identity") {
    const s = identityState(f, data, meta);
    return s.number ? [s.doc, s.countryName, s.number].filter(Boolean).join(" · ") : "";
  }
  const v = data[f.name] || "";
  if (f.type === "country") return meta?.countries.find((c) => c.code === v)?.name || v;
  return v;
}

/** Problems the applicant can fix before the form is sent (the server checks again). */
export function fieldProblem(f: Field, data: Record<string, string>, meta: IdentityMeta | null): string | null {
  if (f.type === "identity") {
    const s = identityState(f, data, meta);
    if (!s.number) return f.required ? `${f.label}: enter the document number.` : null;
    if (!s.country) return `${f.label}: choose the nationality.`;
    if (!s.doc) return `${f.label}: choose the document type.`;
    if (s.rule && !s.valid) return `${f.label}: a ${s.doc === "Passport" ? `${s.countryName} passport` : "National ID"} number is ${s.rule.format}.`;
    return null;
  }
  const v = (data[f.name] || "").trim();
  if (!v) return f.required ? `${f.label} is required.` : null;
  if (f.type === "email" && !/^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$/.test(v)) return `${f.label} must be a valid email address.`;
  if (f.type === "phone" && !/^\+?\d{7,15}$/.test(v.replace(/[\s\-()]/g, ""))) return `${f.label} must be a phone number with 7 to 15 digits.`;
  if (f.max_length && v.length > f.max_length) return `${f.label} must be ${f.max_length} characters or fewer.`;
  return null;
}
