import {
  Baby, Briefcase, Car, Fingerprint, GraduationCap, HardHat, HeartHandshake, Landmark, Leaf, MapPinned, Plane, Receipt, Scale, Stamp, Zap, Check, type LucideIcon,
} from "lucide-react";
import { STATUS_COLOR, STATUS_LABEL } from "@/lib/api";

const CAT: Record<string, { icon: LucideIcon; tint: string }> = {
  Identity: { icon: Fingerprint, tint: "bg-navy-50 text-navy-800" },
  Travel: { icon: Plane, tint: "bg-sky-50 text-sky-700" },
  Transport: { icon: Car, tint: "bg-amber-50 text-amber-700" },
  Tax: { icon: Receipt, tint: "bg-emerald-50 text-emerald-700" },
  Business: { icon: Briefcase, tint: "bg-violet-50 text-violet-700" },
  Legal: { icon: Scale, tint: "bg-rose-50 text-rose-700" },
  Civil: { icon: Baby, tint: "bg-pink-50 text-pink-700" },
  Land: { icon: MapPinned, tint: "bg-lime-50 text-lime-700" },
  Utilities: { icon: Zap, tint: "bg-yellow-50 text-yellow-700" },
  Immigration: { icon: Stamp, tint: "bg-cyan-50 text-cyan-700" },
  Labour: { icon: HardHat, tint: "bg-orange-50 text-orange-700" },
  Education: { icon: GraduationCap, tint: "bg-indigo-50 text-indigo-700" },
  Environment: { icon: Leaf, tint: "bg-green-50 text-green-700" },
  "Social Security": { icon: HeartHandshake, tint: "bg-teal-50 text-teal-700" },
};

export function CategoryIcon({ category, size = 44 }: { category: string; size?: number }) {
  const c = CAT[category] || { icon: Landmark, tint: "bg-navy-50 text-navy-800" };
  const Icon = c.icon;
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-xl ${c.tint}`} style={{ width: size, height: size }}>
      <Icon size={size * 0.48} strokeWidth={1.8} aria-hidden />
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_COLOR[status] || "bg-slate-100 ring-slate-200"}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {STATUS_LABEL[status] || status}
    </span>
  );
}

export function Stepper({ steps, current, onSelect }: { steps: string[]; current: number; onSelect?: (i: number) => void }) {
  return (
    <ol className="flex items-center gap-1 sm:gap-2">
      {steps.map((s, i) => {
        const done = i < current, on = i === current;
        return (
          <li key={s} className="flex flex-1 items-center gap-1 sm:gap-2">
            <button type="button" onClick={() => onSelect?.(i)} disabled={!onSelect}
              className="flex min-w-0 items-center gap-2 rounded-lg p-1 text-left disabled:cursor-default">
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${done ? "bg-emerald-500 text-white" : on ? "bg-navy-800 text-white ring-4 ring-navy-100" : "bg-slate-200 text-ink-500"}`}>
                {done ? <Check size={14} strokeWidth={3} /> : i + 1}
              </span>
              <span className={`hidden truncate text-sm sm:block ${on ? "font-semibold text-ink-900" : "text-ink-500"}`}>{s}</span>
            </button>
            {i < steps.length - 1 && <span className={`h-0.5 flex-1 rounded ${done ? "bg-emerald-400" : "bg-slate-200"}`} />}
          </li>
        );
      })}
    </ol>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

/** Lone Star mark */
export function Star({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" aria-hidden>
      <path d="M12 1.8l2.9 6.6 7.1.7-5.4 4.8 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.1l7.1-.7z" />
    </svg>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-flag-600 text-white shadow-sm"><Star size={18} /></span>
      <span className={`text-xl font-extrabold tracking-tight ${light ? "text-white" : "text-navy-900"}`}>
        e<span className={light ? "text-white" : "text-flag-600"}>Liberia</span>
      </span>
    </span>
  );
}
