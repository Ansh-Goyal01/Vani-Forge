import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { inter, interTight, jetbrains } from "./fonts";

export const metadata: Metadata = {
  title: "VaniForge",
  description: "Give your business a voice. Describe an agent in plain words, break it before customers do, then put it to work.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${interTight.variable} ${inter.variable} ${jetbrains.variable}`}>
      <body>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
