// Petites icônes (traits fins, style « labo »).
type P = React.SVGProps<SVGSVGElement>;
const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const IconCheck = (p: P) => (
  <svg {...base} {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);
export const IconArrowRight = (p: P) => (
  <svg {...base} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
export const IconArrowLeft = (p: P) => (
  <svg {...base} {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);
export const IconChevronUp = (p: P) => (
  <svg {...base} {...p}>
    <path d="M6 15l6-6 6 6" />
  </svg>
);
export const IconChevronDown = (p: P) => (
  <svg {...base} {...p}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);
export const IconGrip = (p: P) => (
  <svg {...base} {...p} fill="currentColor" stroke="none">
    {[6, 12, 18].map((y) => (
      <g key={y}>
        <circle cx="9" cy={y} r="1.5" />
        <circle cx="15" cy={y} r="1.5" />
      </g>
    ))}
  </svg>
);
export const IconThermo = (p: P) => (
  <svg {...base} {...p}>
    <path d="M10 13.5V5a2 2 0 1 1 4 0v8.5a4 4 0 1 1-4 0z" />
    <path d="M12 16.5V10" />
  </svg>
);
export const IconOrder = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 7h10M4 12h7M4 17h4M17 5v14M14 16l3 3 3-3" />
  </svg>
);
export const IconDrop = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 3.5s6 6.4 6 10.5a6 6 0 0 1-12 0c0-4.1 6-10.5 6-10.5z" />
  </svg>
);
export const IconLock = (p: P) => (
  <svg {...base} {...p}>
    <rect x="5" y="10.5" width="14" height="9.5" rx="2.5" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
  </svg>
);
export const IconCloud = (p: P) => (
  <svg {...base} {...p}>
    <path d="M7 18.5h10.5a4 4 0 0 0 .4-7.98A5.5 5.5 0 0 0 7.3 9.6 4.5 4.5 0 0 0 7 18.5z" />
  </svg>
);
export const IconCopy = (p: P) => (
  <svg {...base} {...p}>
    <rect x="8.5" y="8.5" width="11" height="11" rx="2.5" />
    <path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" />
  </svg>
);
export const IconPlus = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const IconTrash = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4.5 7h15M9.5 7V5h5v2M6.5 7l1 12.5h9l1-12.5" />
  </svg>
);
export const IconDownload = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 4v11M7 10.5l5 5 5-5M5 19.5h14" />
  </svg>
);
export const IconExternal = (p: P) => (
  <svg {...base} {...p}>
    <path d="M14 5h5v5M19 5l-8 8M17 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 4 18.5v-10A1.5 1.5 0 0 1 5.5 7H10" />
  </svg>
);
export const IconEdit = (p: P) => (
  <svg {...base} {...p}>
    <path d="M14.5 5.5l4 4M4.5 19.5l1-4.5L15.8 4.7a1.4 1.4 0 0 1 2 0l1.5 1.5a1.4 1.4 0 0 1 0 2L9 18.5z" />
  </svg>
);

/** Canette en aluminium, bandeau aux couleurs de la boîte et lettre de l'itération. */
export function CanIcon({
  letter,
  size = 40,
  filled = true,
  className = "",
}: {
  letter: string;
  size?: number;
  filled?: boolean;
  className?: string;
}) {
  const id = `can-${letter}-${filled ? "f" : "o"}`;
  return (
    <svg
      width={size}
      height={size * 1.7}
      viewBox="0 0 60 102"
      className={`shrink-0 ${className}`}
      aria-hidden
      role="presentation"
    >
      <defs>
        <linearGradient id={`${id}-metal`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#bdb6b0" />
          <stop offset="0.18" stopColor="#f3f0ed" />
          <stop offset="0.42" stopColor="#cfc9c4" />
          <stop offset="0.7" stopColor="#efebe8" />
          <stop offset="1" stopColor="#aaa39d" />
        </linearGradient>
        <linearGradient id={`${id}-label`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={filled ? "#E8457A" : "#FFFFFF"} />
          <stop offset="1" stopColor={filled ? "#F28C5B" : "#F8F5F2"} />
        </linearGradient>
        <linearGradient id={`${id}-shade`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.16" />
          <stop offset="0.22" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.85" stopColor="#000" stopOpacity="0.06" />
          <stop offset="1" stopColor="#000" stopOpacity="0.2" />
        </linearGradient>
        <pattern id={`${id}-dots`} width="5" height="5" patternUnits="userSpaceOnUse">
          <circle cx="1.2" cy="1.2" r="0.75" fill={filled ? "#fff" : "#E8457A"} fillOpacity={filled ? 0.32 : 0.35} />
        </pattern>
      </defs>
      {/* corps */}
      <path d="M7 12 Q7 8 11 7 L49 7 Q53 8 53 12 L54 18 L54 86 L53 92 Q53 96 49 97 L11 97 Q7 96 7 92 L6 86 L6 18 Z" fill={`url(#${id}-metal)`} />
      {/* couvercle */}
      <ellipse cx="30" cy="8" rx="21" ry="4" fill="#d8d3ce" />
      <ellipse cx="30" cy="8.3" rx="16" ry="2.8" fill="#bcb5af" />
      <rect x="25.5" y="6.3" width="9" height="3" rx="1.5" fill="#e6e2de" />
      {/* bandeau imprimé */}
      <rect x="6" y="22" width="48" height="60" fill={`url(#${id}-label)`} />
      <rect x="6" y="22" width="48" height="60" fill={`url(#${id}-dots)`} />
      {!filled && <rect x="6" y="22" width="48" height="60" fill="none" stroke="#E7E1DB" strokeWidth="0.8" />}
      <text
        x="30"
        y="34"
        textAnchor="middle"
        fontFamily="Outfit Variable, Outfit, sans-serif"
        fontWeight="600"
        fontSize="5"
        letterSpacing="1.2"
        fill={filled ? "#fff" : "#E8457A"}
        fillOpacity="0.9"
      >
        ITERATION
      </text>
      <text
        x="30"
        y="64"
        textAnchor="middle"
        fontFamily="Outfit Variable, Outfit, sans-serif"
        fontWeight="600"
        fontSize="28"
        fill={filled ? "#fff" : "#2B2B2B"}
      >
        {letter}
      </text>
      <rect x="6" y="22" width="48" height="60" fill={`url(#${id}-shade)`} />
      <path d="M6 18 L54 18 M6 86 L54 86" stroke="#9f9893" strokeOpacity="0.45" strokeWidth="0.8" />
    </svg>
  );
}

/** Quelques bulles qui montent (effet pétillant, désactivé si l'utilisateur réduit les animations). */
export function Bubbles({ count = 12, className = "" }: { count?: number; className?: string }) {
  const items = Array.from({ length: count }, (_, i) => {
    const r = (n: number) => ((Math.sin((i + 1) * n) + 1) / 2);
    return {
      left: `${Math.round(r(12.9898) * 100)}%`,
      size: 4 + Math.round(r(78.233) * 9),
      duration: 5 + r(3.7) * 6,
      delay: -r(9.1) * 10,
    };
  });
  return (
    <div className={`bubbles ${className}`} aria-hidden>
      {items.map((b, i) => (
        <span
          key={i}
          style={{
            left: b.left,
            width: b.size,
            height: b.size,
            animationDuration: `${b.duration.toFixed(2)}s`,
            animationDelay: `${b.delay.toFixed(2)}s`,
          }}
        />
      ))}
    </div>
  );
}
