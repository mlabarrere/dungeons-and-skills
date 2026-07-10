// SVG inline pour la fiche officielle. Traits gris (currentColor via --line).

export function ShieldOutline({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 118"
      fill="none"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M6 6 H94 V64 C94 92 74 108 50 114 C26 108 6 92 6 64 Z"
        stroke="#6b6b6b"
        strokeWidth="1.6"
      />
      <path
        d="M11 11 H89 V63 C89 88 71 102 50 108 C29 102 11 88 11 63 Z"
        stroke="#c4c4c4"
        strokeWidth="1"
      />
    </svg>
  );
}

/** Petite étoile à quatre branches (inspiration héroïque, harmonisation…). */
export function Sparkle({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 1 C13 8 16 11 23 12 C16 13 13 16 12 23 C11 16 8 13 1 12 C8 11 11 8 12 1 Z"
        fill="none"
        stroke="#6b6b6b"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}
