"use client";
import { useEffect, useState } from "react";
import { Signal, Smartphone } from "lucide-react";
import { API } from "@/lib/api";

export default function UssdSimulator() {
  const [chain, setChain] = useState<string[]>([]);
  const [screen, setScreen] = useState("");
  const [ended, setEnded] = useState(false);
  const [input, setInput] = useState("");
  const [started, setStarted] = useState(false);
  const [busy, setBusy] = useState(false);

  async function send(parts: string[]) {
    setBusy(true);
    try {
      const r = await fetch(`${API}/api/ussd`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ sessionId: "web-sim", serviceCode: "*231#", phoneNumber: "", text: parts.join("*") }) });
      const t = await r.text();
      if (!r.ok && !/^(CON|END)/.test(t)) throw new Error();
      setEnded(t.startsWith("END")); setScreen(t.replace(/^(CON|END) ?/, "")); setChain(parts);
    } catch { setEnded(true); setScreen("Connection problem. The service may be waking up - dial again."); }
    finally { setBusy(false); setInput(""); }
  }
  const dial = () => { setStarted(true); send([]); };
  const reply = (e: React.FormEvent) => { e.preventDefault(); if (input.trim()) send([...chain, input.trim()]); };
  useEffect(() => { if (ended) setChain([]); }, [ended]);

  return (
    <div className="container-x py-10 sm:py-14">
      <div className="mx-auto grid max-w-4xl items-center gap-10 md:grid-cols-2">
        <div>
          <div className="eyebrow">No smartphone needed</div>
          <h1 className="mt-1 text-3xl font-extrabold">eLiberia on any phone</h1>
          <p className="mt-3 text-ink-700">People with a basic phone and no internet can dial a short code to track an application, check a fee, or confirm that a certificate is genuine.</p>
          <ul className="mt-5 space-y-2 text-sm text-ink-700">
            <li className="flex gap-2"><Signal size={17} className="mt-0.5 shrink-0 text-navy-600" /> Works without data or airtime for internet.</li>
            <li className="flex gap-2"><Smartphone size={17} className="mt-0.5 shrink-0 text-navy-600" /> Use the bill ID printed on your receipt - it is all numbers.</li>
          </ul>
          <div className="alert alert-info mt-6">This is a simulator. The same menu is ready to connect to a telecom short code once a USSD gateway contract is in place. “My applications” only works from a real handset.</div>
        </div>
        <div className="mx-auto w-full max-w-[19rem] rounded-[2.2rem] bg-ink-900 p-3 shadow-lift">
          <div className="flex h-[30rem] flex-col rounded-[1.6rem] bg-[#0b1220] p-4 font-mono text-sm text-emerald-200">
            <div className="flex justify-between text-[11px] text-emerald-200/60"><span>eLiberia</span><span>*231#</span></div>
            {!started ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4">
                <p className="text-center text-emerald-200/80">Dial the short code to begin</p>
                <button onClick={dial} className="rounded-full bg-emerald-500 px-6 py-3 font-sans font-bold text-ink-900 hover:bg-emerald-400">Dial *231#</button>
              </div>
            ) : (
              <>
                <div className="mt-3 flex-1 overflow-y-auto whitespace-pre-wrap rounded-xl bg-black/30 p-3 leading-relaxed" aria-live="polite">{busy ? "…" : screen}</div>
                {ended ? (
                  <button onClick={dial} className="mt-3 rounded-xl bg-emerald-500 py-2.5 font-sans font-bold text-ink-900 hover:bg-emerald-400">Dial again</button>
                ) : (
                  <form onSubmit={reply} className="mt-3 flex gap-2">
                    <input autoFocus value={input} onChange={(e) => setInput(e.target.value)} aria-label="Your reply" placeholder="Reply"
                      className="w-full rounded-xl bg-black/40 px-3 py-2.5 text-emerald-100 placeholder:text-emerald-200/40 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                    <button disabled={busy} className="rounded-xl bg-emerald-500 px-4 font-sans font-bold text-ink-900 hover:bg-emerald-400">Send</button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
