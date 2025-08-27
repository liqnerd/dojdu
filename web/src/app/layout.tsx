import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { UserMenu } from "@/components/auth/UserMenu";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dojdu v2",
  description: "Find events, RSVP, and go together.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <header className="sticky top-0 z-30 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
          <div className="container mx-auto flex items-center justify-between py-3 px-4">
            <Link href="/" className="text-xl md:text-2xl font-semibold tracking-tight bg-gradient-to-r from-fuchsia-500 via-pink-500 to-sky-400 bg-clip-text text-transparent">Dojdu</Link>
            <nav className="flex items-center gap-5 text-sm">
              <Link href="/create" className="transition-colors hover:text-primary">Create</Link>
              <Link href="/all" className="transition-colors hover:text-primary">All</Link>
              <Link href="/today" className="transition-colors hover:text-primary">Today</Link>
              <Link href="/upcoming" className="transition-colors hover:text-primary">Upcoming</Link>
              <ThemeToggle />
              <UserMenu />
            </nav>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
