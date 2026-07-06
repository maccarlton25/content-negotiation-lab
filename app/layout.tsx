import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Content Negotiation Lab · Next.js on Vercel",
    template: "%s · Content Negotiation Lab",
  },
  description:
    "A hands-on lab for learning content negotiation — making agent-friendly pages that serve markdown to agents and HTML to browsers from the same URL.",
};

const NAV = [
  { href: "/experiments/negotiation", label: "1 · Negotiation" },
  { href: "/experiments/accept", label: "2 · Accept" },
  { href: "/experiments/sitemap", label: "3 · Sitemaps" },
  { href: "/experiments/discovery", label: "4 · Discovery" },
  { href: "/experiments/tokens", label: "5 · Tokens" },
  { href: "/blog", label: "Blog" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-dvh bg-background-100 font-sans text-gray-1000 antialiased">
        <header className="sticky top-0 z-40 border-b border-gray-400 bg-background-100/90 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4">
            <Link href="/" className="text-label-14 font-semibold">
              CN Lab
            </Link>
            <nav className="flex items-center gap-4 overflow-x-auto text-label-13 text-gray-700">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="whitespace-nowrap transition-colors hover:text-gray-1000"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 pb-24">{children}</main>
      </body>
    </html>
  );
}
