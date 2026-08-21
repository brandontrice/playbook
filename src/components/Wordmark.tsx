// The brand mark: a real logotype instead of plain text, with the
// telestrator stroke (the coach's marker underline) as the logo concept
// itself, drawn in on mount via the same pb-draw animation the player's
// arrows use.
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 44" className={className} role="img" aria-label="Playbook">
      <text
        x="0"
        y="28"
        fontFamily="'Barlow Condensed', sans-serif"
        fontWeight={700}
        fontSize="28"
        letterSpacing="0.5"
        fill="var(--pb-text)"
      >
        PLAYBOOK
      </text>
      <path
        d="M2,36 C 40,44 150,44 205,33"
        fill="none"
        stroke="var(--pb-accent)"
        strokeWidth="3"
        strokeLinecap="round"
        pathLength={1}
        className="pb-draw"
      />
      <path d="M199,28 L207,33 L198,37 Z" fill="var(--pb-accent)" />
    </svg>
  );
}
