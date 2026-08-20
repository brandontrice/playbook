import type { Diagram } from "../../types";

export function Chalkboard({ diagram }: { diagram: Diagram }) {
  const { players, ball, annotations } = diagram.spec;

  return (
    <div className="overflow-hidden rounded-[var(--radius-pb)] border border-surface-border bg-surface p-2">
      <svg viewBox="0 0 100 60" className="h-auto w-full">
        <rect x={0} y={0} width={100} height={60} fill="var(--pb-bg-2)" />
        <rect x={1} y={1} width={98} height={58} fill="none" stroke="var(--pb-text-dim)" strokeWidth={0.4} />
        <circle cx={50} cy={30} r={8} fill="none" stroke="var(--pb-text-dim)" strokeWidth={0.4} />

        {annotations.map((a, i) => {
          if (a.type === "arrow") {
            return (
              <g key={i}>
                <defs>
                  <marker id={`diag-arrow-${i}`} markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" fill="var(--pb-accent)" />
                  </marker>
                </defs>
                <line
                  x1={a.x1}
                  y1={a.y1}
                  x2={a.x2}
                  y2={a.y2}
                  stroke="var(--pb-accent)"
                  strokeWidth={0.6}
                  markerEnd={`url(#diag-arrow-${i})`}
                />
              </g>
            );
          }
          if (a.type === "screen") {
            return <rect key={i} x={a.x - 1.5} y={a.y - 0.5} width={3} height={1} fill="var(--pb-primary)" />;
          }
          return (
            <text key={i} x={a.x} y={a.y} fontSize={2.5} fill="var(--pb-text-dim)">
              {a.text}
            </text>
          );
        })}

        {players.map((p) => (
          <g key={p.id}>
            <circle
              cx={p.x}
              cy={p.y}
              r={2.2}
              fill={p.team === "offense" ? "var(--pb-primary)" : "var(--pb-accent-2)"}
            />
            <text x={p.x} y={p.y + 0.8} fontSize={2} textAnchor="middle" fill="black" fontWeight="bold">
              {p.id}
            </text>
          </g>
        ))}

        {ball && <circle cx={ball.x} cy={ball.y} r={1} fill="var(--pb-accent)" />}
      </svg>
    </div>
  );
}
