/** The « point d'orgue » (fermata), drawn in the current text colour. */
export default function Fermata({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 56"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M6 52 C 10 6, 90 6, 94 52"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <circle cx="50" cy="44" r="9" fill="currentColor" />
    </svg>
  );
}
