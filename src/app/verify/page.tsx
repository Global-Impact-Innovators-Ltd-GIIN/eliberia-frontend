"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BadgeCheck, QrCode } from "lucide-react";

export default function VerifyIndex() {
  const [n, setN] = useState("");
  const router = useRouter();
  return (
    <div className="container-x py-10 sm:py-14">
      <div className="mx-auto max-w-xl text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white"><BadgeCheck size={30} /></span>
        <h1 className="mt-4 text-3xl font-extrabold">Verify a certificate</h1>
        <p className="muted mt-2">Check that a document issued through eLiberia is genuine. Scan its QR code with your phone camera, or type the certificate number printed on it.</p>
        <form onSubmit={(e) => { e.preventDefault(); if (n.trim()) router.push(`/verify/${encodeURIComponent(n.trim().toUpperCase())}`); }}
          className="mt-6 flex gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-card">
          <QrCode className="ml-2 mt-2.5 shrink-0 text-ink-500" size={22} />
          <input className="w-full bg-transparent px-2 py-2 font-mono text-base uppercase placeholder:font-sans placeholder:normal-case focus:outline-none" placeholder="e.g. ELC-2026-1A2B3C4D" value={n} onChange={(e) => setN(e.target.value)} aria-label="Certificate number" required />
          <button className="btn btn-lg shrink-0">Verify</button>
        </form>
      </div>
    </div>
  );
}
