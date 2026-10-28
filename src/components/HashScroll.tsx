"use client";

import { useEffect } from "react";

/**
 * Arriving on the landing page from another page with a hash (for example /#agents from the studio):
 * Next scrolls before the page has finished laying out, so settle on the target once layout is done.
 */
export function HashScroll() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    const go = () => document.getElementById(id)?.scrollIntoView({ behavior: "auto", block: "start" });
    const raf = requestAnimationFrame(() => requestAnimationFrame(go));
    const t = window.setTimeout(go, 450);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, []);
  return null;
}
