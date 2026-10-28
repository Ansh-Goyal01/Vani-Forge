import localFont from "next/font/local";

/** Bundled fonts (no Google Fonts request). Inter Tight: headlines and numerals. Inter: body. JetBrains Mono: labels, specs, X-Ray. */
export const interTight = localFont({
  src: [{ path: "../fonts/InterTight.ttf", style: "normal", weight: "100 900" }],
  variable: "--font-inter-tight",
  display: "swap",
});

export const inter = localFont({
  src: [{ path: "../fonts/Inter.ttf", style: "normal", weight: "100 900" }],
  variable: "--font-inter",
  display: "swap",
});

export const jetbrains = localFont({
  src: [{ path: "../fonts/JetBrainsMono.ttf", style: "normal", weight: "100 800" }],
  variable: "--font-jbm",
  display: "swap",
});
