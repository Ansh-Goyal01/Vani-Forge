import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { RevealObserver } from "@/components/RevealObserver";
import { inter, interTight, jetbrains } from "./fonts";

export const metadata: Metadata = {
  title: "VaniForge: voice agents that are tested before they talk to your customers",
  description: "Describe a voice agent in plain English or Hindi. VaniForge builds it on ElevenLabs, attacks it with difficult callers, explains what broke and patches it.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the inline script below adds the `js` class before React hydrates.
    <html lang="en" className={`${interTight.variable} ${inter.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>
        <a href="#main" className="label sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-card focus:p-3">Skip to content</a>
        <Header />
        <main id="main">{children}</main>
        <RevealObserver />
      </body>
    </html>
  );
}
