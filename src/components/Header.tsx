"use client";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function Header() {
  const { user, logout } = useAuth();
  const staff = user && user.role !== "citizen";
  return (
    <header className="bg-lib-blue text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <span className="inline-block h-5 w-5 rounded-sm bg-lib-red" /> eLiberia
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/services" className="hover:underline">Services</Link>
          <Link href="/track" className="hover:underline">Track</Link>
          {user ? (
            <>
              <Link href={staff ? "/staff" : "/dashboard"} className="hover:underline">
                {staff ? "Staff desk" : "My applications"}
              </Link>
              <span className="hidden text-blue-200 sm:inline">{user.full_name}</span>
              <button onClick={logout} className="rounded bg-white/10 px-3 py-1 hover:bg-white/20">Sign out</button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:underline">Sign in</Link>
              <Link href="/register" className="rounded bg-lib-red px-3 py-1 font-semibold hover:bg-red-700">Register</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
