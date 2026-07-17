/**
 * A small, self-contained padlock glyph used for the E2EE affordances (lobby
 * toggle + active-call header badge). The SDK icon set has no lock, and this
 * avoids basePath handling for a public SVG asset. Uses `currentColor` so it
 * inherits the surrounding text color in both light and dark themes.
 */
export const LockIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M7 10V7a5 5 0 0 1 10 0v3"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <rect x="4.5" y="10" width="15" height="10" rx="2.5" fill="currentColor" />
  </svg>
);
