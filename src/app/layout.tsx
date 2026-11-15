import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Assistant from "@/components/Assistant";

const font = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: { default: "eLiberia - Government services online", template: "%s · eLiberia" },
  description: "Apply for IDs, passports, licenses, business registration and more - from home. Pay by mobile money, verify your identity remotely, and receive verifiable e-certificates.",
};
export const viewport: Viewport = { themeColor: "#002868", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={font.variable}>
      <body className="flex min-h-screen flex-col font-sans">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2">Skip to content</a>
        <AuthProvider>
          <Header />
          <main id="main" className="flex-1">{children}</main>
          <Footer />
          <Assistant />
        </AuthProvider>
      </body>
    </html>
  );
}
