# Hero image

The landing page looks for `public/hero/hero-object.png`. If the file exists it is shown with `next/image`; if not, a plum line-art studio microphone (inline SVG) is shown instead, so the page never looks broken. The check happens on the server at render time (`src/components/Hero.tsx`).

Requirements for the file:

- A transparent background, or a plain dusty mauve one (`#C9A0A7`). A soft radial CSS mask blends the edges into the page.
- Portrait, about 3:4, at least 1600 px tall.
- AI-generated or free-licence only. No people, no logos, no text.
- Suggested subject: a vintage 1950s studio ribbon microphone upright on a small round stand, deep plum lacquer (`#3A0F34`), terracotta (`#C75A3A`) accents, soft warm light from the upper left.
