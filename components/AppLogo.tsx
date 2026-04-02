import { useId } from "react";

type AppLogoProps = {
  /** Pixel width and height (square). */
  size?: number;
  className?: string;
  /** Accessible name; omit or pass "" when decorative (e.g. next to a wordmark). */
  title?: string;
};

/**
 * Brand mark: open book with a small reader — life story / chapters.
 * Works on light and dark pages; rounded tile matches in-app violet accents.
 */
export function AppLogo({
  size = 48,
  className,
  title = "Game of Lyfe",
}: AppLogoProps) {
  const gid = useId().replace(/:/g, "");
  const decorative = title === "";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role={decorative ? "presentation" : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : title}
    >
      {!decorative ? <title>{title}</title> : null}
      <defs>
        <linearGradient
          id={`AppLogo-grad-${gid}`}
          x1="10"
          y1="6"
          x2="56"
          y2="60"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#a78bfa" />
          <stop offset="1" stopColor="#6d28d9" />
        </linearGradient>
      </defs>
      {/* Tile */}
      <rect
        width="64"
        height="64"
        rx="14"
        fill={`url(#AppLogo-grad-${gid})`}
      />
      {/* Book (open, simplified for small sizes) */}
      <path
        d="M32 26 17 46.5 32 52.5 47 46.5z"
        fill="#fafafa"
        stroke="#e4e4e7"
        strokeWidth="1.25"
      />
      <path
        d="M32 29.5v20.5M23.5 45 32 49l8.5-4"
        stroke="#a1a1aa"
        strokeWidth="1.1"
        strokeLinecap="round"
        fill="none"
        opacity={0.85}
      />
      {/* Reader — minimal “kid” head + hint of hair */}
      <circle cx="32" cy="21" r="6.25" fill="#fde68a" />
      <path
        d="M25.5 17.5c1.8-3.2 5.8-4.4 9.2-2.8 1.9.9 3.2 2.6 3.5 4.6"
        stroke="#854d0e"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
      {/* Page highlight */}
      <path
        d="M32 28.5 21 43.5"
        stroke="#f4f4f5"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity={0.9}
      />
    </svg>
  );
}
