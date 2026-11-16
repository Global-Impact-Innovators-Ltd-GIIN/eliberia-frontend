"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, LogOut, Menu, ShieldCheck, UserRound, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Logo } from "./ui";

export default function Header() {
  const { user, logout } = useAuth();
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const staff = user && user.role !== "citizen";
  useEffect(() => { setOpen(false); setMenu(false); }, [path]);

  const links = [
    { href: "/services", label: "Services" },
    { href: "/track", label: "Track application" },
    { href: "/verify", label: "Verify certificate" },
    ...(user ? [user.role === "agent" ? { href: "/agent", label: "Agent desk" }
      : { href: staff ? "/staff" : "/dashboard", label: staff ? "Staff desk" : "My applications" }] : []),
  ];
  const cls = (href: string) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${path.startsWith(href) ? "bg-navy-50 text-navy-800" : "text-ink-700 hover:bg-slate-100 hover:text-ink-900"}`;
  const signOut = () => { logout(); router.push("/"); };

  return (
    <header className="no-print sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
      <div className="h-1 bg-gradient-to-r from-flag-600 via-white to-navy-800" />
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="eLiberia home"><Logo /></Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => <Link key={l.href} href={l.href} className={cls(l.href)}>{l.label}</Link>)}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <div className="relative">
              <button onClick={() => setMenu(!menu)} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-2.5 text-sm font-medium hover:border-navy-200" aria-expanded={menu}>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-800 text-xs font-bold text-white">
                  {user.full_name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                </span>
                <span className="max-w-[9rem] truncate">{user.full_name}</span>
                <ChevronDown size={15} className="text-ink-500" />
              </button>
              {menu && (
                <div className="absolute right-0 mt-2 w-52 animate-rise rounded-xl border border-slate-200 bg-white p-1.5 shadow-lift">
                  <Link href="/account" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-100"><UserRound size={16} /> Account &amp; security</Link>
                  <button onClick={signOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-flag-700 hover:bg-flag-50"><LogOut size={16} /> Sign out</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost">Sign in</Link>
              <Link href="/register" className="btn">Create account</Link>
            </>
          )}
        </div>
        <button className="rounded-lg p-2 md:hidden" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="animate-rise border-t border-slate-200 bg-white px-4 pb-4 pt-2 md:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((l) => <Link key={l.href} href={l.href} className={cls(l.href)}>{l.label}</Link>)}
            {user ? (
              <>
                <Link href="/account" className={cls("/account")}><ShieldCheck size={15} className="mr-1.5 inline" />Account &amp; security</Link>
                <button onClick={signOut} className="rounded-lg px-3 py-2 text-left text-sm font-medium text-flag-700">Sign out</button>
              </>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link href="/login" className="btn btn-ghost">Sign in</Link>
                <Link href="/register" className="btn">Create account</Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
