/** Inline line art: 1.5px strokes, plum on mauve. Decorative; all marked aria-hidden unless noted. */

const STROKE = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function Asterisk({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="-12 -12 24 24" width={size} height={size} aria-hidden className="text-plum">
      <g {...STROKE}>
        {[0, 45, 90, 135].map((a) => (
          <line key={a} x1="0" y1="-10" x2="0" y2="10" transform={`rotate(${a})`} />
        ))}
      </g>
    </svg>
  );
}

/** Auspicious cloud swirl: a scroll of curls. `flip` mirrors it for the other side of the hero. */
export function CloudSwirl({ flip = false, className = "" }: { flip?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 320 200"
      aria-hidden
      className={`text-plum ${className}`}
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      <g {...STROKE}>
        <path d="M20 140 C20 110 60 100 76 122 C92 144 62 164 48 150 C38 140 50 126 62 132" />
        <path d="M76 122 C96 84 150 80 170 108 C190 136 160 160 140 146 C124 134 138 112 154 120" />
        <path d="M170 108 C186 74 236 70 252 100 C268 130 240 150 222 138 C208 128 220 108 236 114" />
        <path d="M20 140 C60 176 150 182 214 168 C262 158 296 140 300 120" />
        <path d="M40 160 C86 190 160 196 226 182" opacity="0.6" />
        <path d="M252 100 C276 92 300 98 306 114" />
      </g>
    </svg>
  );
}

/** Fallback hero object: vintage studio ribbon microphone, plum line art with a terracotta grille. */
export function MicFallback({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 560" role="img" aria-label="A vintage studio microphone, line drawing" className={`text-plum ${className}`}>
      <g {...STROKE}>
        {/* body */}
        <rect x="120" y="40" width="160" height="270" rx="80" />
        <rect x="136" y="56" width="128" height="238" rx="64" stroke="#c75a3a" />
        {/* grille: terracotta */}
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={`h${i}`} x1="146" x2="254" y1={92 + i * 22} y2={92 + i * 22} stroke="#c75a3a" opacity="0.85" />
        ))}
        {Array.from({ length: 4 }).map((_, i) => (
          <line key={`v${i}`} x1={168 + i * 21} x2={168 + i * 21} y1="62" y2="288" stroke="#c75a3a" opacity="0.45" />
        ))}
        {/* collar */}
        <path d="M130 312 h140" />
        <path d="M142 312 l-6 22 h128 l-6 -22" />
        {/* yoke */}
        <path d="M96 150 c-8 90 22 168 104 168 s112 -78 104 -168" />
        <path d="M88 150 h16 M296 150 h16" />
        {/* stem + base */}
        <path d="M200 334 v118" />
        <path d="M184 372 h32 M184 396 h32" />
        <ellipse cx="200" cy="474" rx="92" ry="22" />
        <ellipse cx="200" cy="466" rx="62" ry="14" />
        <path d="M108 474 v14 c0 14 40 24 92 24 s92 -10 92 -24 v-14" />
      </g>
    </svg>
  );
}

/** Terracotta medallion: a leaf whose veins form a sound wave. */
export function Medallion({ size = 170 }: { size?: number }) {
  const bars = [10, 18, 28, 40, 52, 40, 30, 44, 56, 42, 28, 18, 10];
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-label="A leaf whose veins form a sound wave" className="text-plum">
      <circle cx="100" cy="100" r="98" fill="#c75a3a" />
      <g {...STROKE}>
        <path d="M44 138 C44 78 100 40 162 50 C170 112 128 160 62 152 C54 150 48 146 44 138 Z" />
        <path d="M44 138 C30 150 22 160 16 172" />
        {/* midrib */}
        <path d="M44 138 C86 112 124 86 156 56" />
        {/* veins as sound-wave bars on either side of the midrib */}
        {bars.map((h, i) => {
          const t = i / (bars.length - 1);
          const x = 56 + t * 94;
          const y = 134 - t * 76;
          return <line key={i} x1={x - 2} y1={y - h * 0.32} x2={x - 2} y2={y + h * 0.18} transform={`rotate(-38 ${x} ${y})`} />;
        })}
      </g>
    </svg>
  );
}

export function IconSheet() {
  return (
    <svg viewBox="0 0 48 48" width="44" height="44" aria-hidden className="text-plum">
      <g {...STROKE}>
        <path d="M12 6h18l8 8v28H12z" />
        <path d="M30 6v8h8" />
        <path d="M18 22h14M18 28h14M18 34h8" />
        <path d="M20 17l2 2 4-4" />
      </g>
    </svg>
  );
}

export function IconBreak() {
  return (
    <svg viewBox="0 0 48 48" width="44" height="44" aria-hidden className="text-plum">
      <g {...STROKE}>
        <path d="M24 6l14 6v12c0 9-6 15-14 18C16 39 10 33 10 24V12z" />
        <path d="M24 14l-4 9h6l-4 10" />
      </g>
    </svg>
  );
}

export function IconDeploy() {
  return (
    <svg viewBox="0 0 48 48" width="44" height="44" aria-hidden className="text-plum">
      <g {...STROKE}>
        <rect x="14" y="6" width="20" height="36" rx="5" />
        <path d="M21 36h6" />
        <path d="M8 18c-3 4-3 8 0 12M40 18c3 4 3 8 0 12" />
        <path d="M4 14c-5 7-5 13 0 20M44 14c5 7 5 13 0 20" opacity="0.6" />
      </g>
    </svg>
  );
}
