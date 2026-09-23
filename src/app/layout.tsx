import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Playfair_Display } from "next/font/google";
import Nav from "@/components/Nav";
import "./globals.css";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Levanto Lens · a Sage proof of concept",
  description: "A live demo of Sage, the decision model.",
};

/** Fixed-height shell: the nav, then a main the demo fills without page scroll. */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} ${playfairDisplay.variable}`}>
      <body className="antialiased">
        <div className="flex h-dvh flex-col overflow-hidden">
          <Nav />
          <main className="relative isolate flex min-h-0 flex-1 flex-col">{children}</main>
        </div>
      </body>
    </html>
  );
}
