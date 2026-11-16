"use client";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

type Slot = { time: string; slot: string; left: number; past: boolean };

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
function nextWeekday(from: Date) {
  const d = new Date(from);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d;
}

/** Choose a service center, a weekday and one of its free 30-minute slots. */
export default function SlotPicker({ initialCenter = "", busy, label = "Book appointment", onPick }: {
  initialCenter?: string; busy?: boolean; label?: string; onPick: (center: string, slot: string) => void;
}) {
  const [centers, setCenters] = useState<string[]>([]);
  const [center, setCenter] = useState(initialCenter);
  const tomorrow = useMemo(() => { const d = new Date(); d.setDate(d.getDate() + 1); return nextWeekday(d); }, []);
  const [day, setDay] = useState(iso(tomorrow));
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [closed, setClosed] = useState(false);
  const [chosen, setChosen] = useState("");
  const [error, setError] = useState("");
  const maxDay = useMemo(() => { const d = new Date(); d.setDate(d.getDate() + 60); return iso(d); }, []);

  useEffect(() => { api<string[]>("/api/centers").then(setCenters).catch(() => {}); }, []);
  useEffect(() => {
    setChosen(""); setError("");
    if (!center || !day) { setSlots(null); return; }
    setSlots(null);
    api<{ closed: boolean; slots: Slot[] }>(`/api/slots?center=${encodeURIComponent(center)}&date=${day}`)
      .then((r) => { setClosed(r.closed); setSlots(r.slots); }).catch((e) => setError(e.message));
  }, [center, day]);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label" htmlFor="sp-c">Service center</label>
          <select id="sp-c" className="input" value={center} onChange={(e) => setCenter(e.target.value)}>
            <option value="">Choose a center</option>{centers.map((c) => <option key={c}>{c}</option>)}
          </select></div>
        <div><label className="label" htmlFor="sp-d">Date</label>
          <input id="sp-d" className="input" type="date" min={iso(tomorrow)} max={maxDay} value={day} onChange={(e) => setDay(e.target.value)} /></div>
      </div>
      {error && <p className="text-sm text-flag-700">{error}</p>}
      {center && slots === null && !error && <p className="muted">Checking free times…</p>}
      {closed && <p className="muted">Centers are closed at weekends. Choose a weekday.</p>}
      {!!slots?.length && (
        <div>
          <span className="label">Free times</span>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7" role="radiogroup" aria-label="Appointment time">
            {slots.map((s) => {
              const off = s.past || s.left === 0;
              return (
                <button key={s.slot} type="button" role="radio" aria-checked={chosen === s.slot} disabled={off}
                  onClick={() => setChosen(s.slot)} title={s.left === 0 ? "Full" : `${s.left} place${s.left === 1 ? "" : "s"} left`}
                  className={`rounded-lg border px-2 py-2 text-sm font-semibold transition ${chosen === s.slot ? "border-navy-800 bg-navy-800 text-white" : "border-ink-300 bg-white hover:border-navy-400"} disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400 disabled:line-through`}>
                  {s.time}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <button type="button" className="btn" disabled={busy || !center || !chosen} onClick={() => onPick(center, chosen)}>{label}</button>
    </div>
  );
}
