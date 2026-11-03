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

/** Canette stylisée, avec sa lettre. */
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
  const id = `can-g-${letter}`;
  return (
    <svg
      width={size}
      height={size * 1.32}
      viewBox="0 0 40 53"
      className={`shrink-0 ${className}`}
      aria-hidden
      role="presentation"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E8457A" />
          <stop offset="1" stopColor="#F28C5B" />
        </linearGradient>
      </defs>
      <path
        d="M6 6.5C6 4 9 2 13 2h14c4 0 7 2 7 4.5l1.5 3V44l-1.5 3c0 2.5-3 4-7 4H13c-4 0-7-1.5-7-4l-1.5-3V9.5z"
        fill={filled ? `url(#${id})` : "#fff"}
        stroke={filled ? "none" : "#E8E3DD"}
        strokeWidth="1.5"
      />
      <path d="M6.5 9.5h27M6.5 44h27" stroke={filled ? "rgb(255 255 255 / .45)" : "#E8E3DD"} strokeWidth="1.2" />
      <text
        x="20"
        y="32.5"
        textAnchor="middle"
        fontFamily="Outfit Variable, Outfit, sans-serif"
        fontWeight="600"
        fontSize="17"
        fill={filled ? "#fff" : "#2B2B2B"}
      >
        {letter}
      </text>
    </svg>
  );
}
