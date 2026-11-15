import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "eLiberia - Government services online",
  description: "Apply for IDs, passports, licenses, business registration and more - from home.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Header />
          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
          <footer className="mt-10 border-t py-6 text-center text-xs text-slate-500">
            eLiberia - a Global Impact Innovators project. Fees shown are illustrative until confirmed by each agency.
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
