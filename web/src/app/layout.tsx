import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "SignalLedger",
  description:
    "Play-money prediction market for campus congestion forecasting",
};

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/markets", label: "Market" },
  { href: "/requests", label: "Requests" },
  { href: "/evaluation", label: "Evaluation" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <header className="border-b bg-white px-6 py-4">
          <div className="mx-auto flex max-w-4xl items-center justify-between">
            <Link href="/" className="text-xl font-bold tracking-tight">
              SignalLedger
            </Link>
            <nav className="flex gap-6 text-sm font-medium">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
