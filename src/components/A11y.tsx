"use client";
import { useEffect, useState } from "react";
import { Accessibility, Pause, Volume2 } from "lucide-react";

const KEY = "eliberia_a11y";
type Prefs = { size: 0 | 1 | 2; contrast: boolean };
const SIZES = ["100%", "112.5%", "125%"];

function read(): Prefs {
  try { return { size: 0, contrast: false, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { return { size: 0, contrast: false }; }
}
function apply(p: Prefs) {
  document.documentElement.style.fontSize = SIZES[p.size];
  document.documentElement.classList.toggle("hc", p.contrast);
}

/** Text size and high-contrast settings, remembered on this device only. */
export function A11yMenu() {
  const [open, setOpen] = useState(false);
  const [p, setP] = useState<Prefs>({ size: 0, contrast: false });
  useEffect(() => { const x = read(); setP(x); apply(x); }, []);
  const update = (patch: Partial<Prefs>) => setP((prev) => {
    const next = { ...prev, ...patch };
    apply(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
    return next;
  });

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Reading settings"
        className="rounded-xl border border-slate-200 bg-white p-2.5 text-ink-700 transition hover:border-navy-200 hover:text-navy-800"><Accessibility size={18} /></button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 animate-rise space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-lift">
          <div>
            <div className="label">Text size</div>
            <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Text size">
              {(["A", "A+", "A++"] as const).map((l, i) => (
                <button key={l} role="radio" aria-checked={p.size === i} onClick={() => update({ size: i as Prefs["size"] })}
                  className={`rounded-lg border py-1.5 font-bold ${p.size === i ? "border-navy-800 bg-navy-800 text-white" : "border-ink-300"}`} style={{ fontSize: 13 + i * 3 }}>{l}</button>
              ))}
            </div>
          </div>
          <label className="flex items-center justify-between gap-3 text-sm font-medium">High contrast
            <input type="checkbox" className="h-5 w-5 accent-navy-800" checked={p.contrast} onChange={(e) => update({ contrast: e.target.checked })} /></label>
          <p className="text-xs text-ink-500">Saved on this device only.</p>
        </div>
      )}
    </div>
  );
}

/** Reads text aloud with the phone or computer's built-in voice. Hidden where speech is unavailable. */
export function ReadAloud({ text, label = "Listen" }: { text: string; label?: string }) {
  const [ok, setOk] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => { setOk(typeof window !== "undefined" && "speechSynthesis" in window); return () => { try { window.speechSynthesis?.cancel(); } catch {} }; }, []);
  if (!ok) return null;
  const toggle = () => {
    const s = window.speechSynthesis;
    if (speaking) { s.cancel(); setSpeaking(false); return; }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US"; u.rate = 0.92;
    u.onend = () => setSpeaking(false); u.onerror = () => setSpeaking(false);
    s.cancel(); s.speak(u); setSpeaking(true);
  };
  return (
    <button type="button" onClick={toggle} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-navy-800 hover:border-navy-400" aria-pressed={speaking}>
      {speaking ? <Pause size={13} /> : <Volume2 size={13} />} {speaking ? "Stop" : label}
    </button>
  );
}
