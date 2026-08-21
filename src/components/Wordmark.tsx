// The brand mark: a real logotype instead of plain text, with a
// telestrator stroke drawn diagonally through the "P" (a route drawn on a
// play diagram), not an underline sweep beneath the whole word, that
// shape reads as someone else's logo. Draws in on mount via the same
// pb-draw animation the player's arrows use.
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 40" className={className} role="img" aria-label="Playbook">
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
        d="M1,31 L17,4"
        fill="none"
        stroke="var(--pb-accent)"
        strokeWidth="3"
        strokeLinecap="round"
        pathLength={1}
        className="pb-draw"
      />
      <path d="M11,3 L20,2 L16,10 Z" fill="var(--pb-accent)" />
    </svg>
  );
}
