import { CSSProperties } from 'react';

type AcornLogoProps = {
  variant?: 'full' | 'mark';
  height?: number | string;
  width?: number | string;
  color?: string;
  style?: CSSProperties;
  className?: string;
  title?: string;
};

const ACORN_ORANGE = '#E89244';
const ACORN_NAVY = '#1F3A5F';

export function AcornLogo({
  variant = 'full',
  height = 36,
  width,
  color,
  style,
  className,
  title = 'Acorn',
}: AcornLogoProps) {
  const isMark = variant === 'mark';
  const viewBox = isMark ? '0 0 64 64' : '0 0 220 64';
  const computedStyle: CSSProperties = {
    height,
    width: width ?? 'auto',
    display: 'block',
    color: color ?? 'currentColor',
    ...style,
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      role="img"
      aria-label={title}
      style={computedStyle}
      className={className}
    >
      <title>{title}</title>
      <defs>
        <linearGradient id="acorn-arrow-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={ACORN_ORANGE} />
          <stop offset="100%" stopColor={ACORN_NAVY} />
        </linearGradient>
      </defs>

      {/* Acorn mark */}
      <g
        fill="none"
        stroke={ACORN_ORANGE}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Cap */}
        <path d="M 12 24 Q 22 14 32 24 Z" fill={ACORN_ORANGE} fillOpacity="0.08" />
        {/* Cap underline */}
        <path d="M 12 24 L 32 24" />
        {/* Body */}
        <path d="M 14 24 Q 13 40 22 44 Q 31 44 30 24" />
        {/* Stem */}
        <path d="M 22 14 Q 22 8 27 8" />
      </g>

      {/* Arrow growing up-right */}
      <g
        fill="none"
        stroke="url(#acorn-arrow-gradient)"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M 26 36 Q 36 32 44 22 L 54 12" />
        <path d="M 46 12 L 54 12 L 54 20" />
      </g>

      {/* Wordmark */}
      {!isMark && (
        <text
          x="72"
          y="44"
          fontFamily="'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif"
          fontSize="36"
          fontWeight="700"
          letterSpacing="-0.5"
          fill="currentColor"
        >
          Acorn
        </text>
      )}
    </svg>
  );
}

export default AcornLogo;
