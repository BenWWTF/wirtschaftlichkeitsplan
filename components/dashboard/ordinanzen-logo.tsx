/**
 * OrdiFinanzen Logo Component
 * Black and white professional logo
 */
export function OrdiFinanzenLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer circle */}
      <circle
        cx="50"
        cy="50"
        r="48"
        stroke="currentColor"
        strokeWidth="2"
      />

      {/* Bar chart - three bars representing financial growth */}
      <rect x="30" y="60" width="8" height="20" fill="currentColor" />
      <rect x="46" y="50" width="8" height="30" fill="currentColor" />
      <rect x="62" y="40" width="8" height="40" fill="currentColor" />

      {/* Dollar sign overlay */}
      <path
        d="M 50 25 L 50 35 M 48 30 C 46 30 45 31 45 32.5 C 45 34 46 34.5 48 35 L 52 35 C 54 35 55 35.5 55 37 C 55 38.5 54 39 52 39 L 48 39 M 50 39 L 50 45"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
