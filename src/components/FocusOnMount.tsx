"use client";

import { useEffect } from "react";

/** Puts the cursor in one field when the page opens, without scrolling to it. */
export function FocusOnMount({ id }: { id: string }) {
  useEffect(() => {
    document.getElementById(id)?.focus({ preventScroll: true });
  }, [id]);
  return null;
}
