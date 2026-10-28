"use client";

import { useEffect } from "react";

/**
 * One observer for the whole app: any element with `.reveal`, `.story`, `.draw` or `.sweep`
 * gets `.is-in` the first time it scrolls into view. New elements (client navigation,
 * newly rendered sections) are picked up by a MutationObserver.
 */
export function RevealObserver() {
  useEffect(() => {
    const SELECTOR = ".reveal:not(.is-in), .story:not(.is-in), .draw:not(.is-in), .sweep:not(.is-in)";
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    const scan = () => document.querySelectorAll(SELECTOR).forEach((el) => io.observe(el));
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
  return null;
}
