import localFont from "next/font/local";

/** Bundled fonts (no Google Fonts request). Bodoni Moda: display. Jost: everything else. JetBrains Mono: X-Ray, latency, code only. */
export const bodoni = localFont({
  src: [
    { path: "../fonts/BodoniModa.ttf", style: "normal", weight: "400 900" },
    { path: "../fonts/BodoniModa-Italic.ttf", style: "italic", weight: "400 900" },
  ],
  variable: "--font-bodoni",
  display: "swap",
});

export const jost = localFont({
  src: [
    { path: "../fonts/Jost.ttf", style: "normal", weight: "100 900" },
    { path: "../fonts/Jost-Italic.ttf", style: "italic", weight: "100 900" },
  ],
  variable: "--font-jost",
  display: "swap",
});

export const jetbrains = localFont({
  src: [{ path: "../fonts/JetBrainsMono.ttf", style: "normal", weight: "100 800" }],
  variable: "--font-jbm",
  display: "swap",
});
