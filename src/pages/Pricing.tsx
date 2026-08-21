import type { ReactNode } from "react";
import { Link } from "react-router-dom";

const FREE_FEATURES = [
  "A handful of full breakdowns to start",
  "Chalkboard diagrams and quiz mode",
  "Both themes, MyPark and Showtime",
  "AI chat explainer",
];

const PRO_FEATURES = [
  "The full concept library, every sport",
  "Team filters, learn it through your team",
  "Pregame primers before your team tips off",
  "New breakdowns added every week",
];

function Pip() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" className="mt-0.5 shrink-0" aria-hidden="true">
      <circle cx="10" cy="10" r="9" stroke="var(--pb-accent)" strokeWidth="1.5" />
      <path d="M6 10.5 L9 13.5 L14 7" stroke="var(--pb-accent)" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlanCard({
  name,
  price,
  cadence,
  features,
  cta,
  featured,
}: {
  name: string;
  price: string;
  cadence: string;
  features: string[];
  cta: ReactNode;
  featured?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-5 rounded-[var(--radius-pb)] border p-6 ${
        featured ? "pb-glow border-primary bg-surface" : "border-surface-border bg-bg-2"
      }`}
    >
      <div>
        <p className="font-display text-2xl uppercase tracking-wide">{name}</p>
        <p className="mt-1">
          <span className="pb-numeral text-4xl">{price}</span>
          <span className="ml-1 text-sm text-text-dim">{cadence}</span>
        </p>
      </div>
      <ul className="flex flex-col gap-2 text-sm text-text-dim">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Pip />
            {f}
          </li>
        ))}
      </ul>
      <div className="mt-auto">{cta}</div>
    </div>
  );
}

export function Pricing() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="mb-2 font-display text-4xl uppercase tracking-wide">Pick your locker.</h1>
      <p className="mb-8 max-w-xl text-text-dim">
        Start with a few free breakdowns. Go Pro when you're ready for the full film room.
      </p>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <PlanCard
          name="Free"
          price="$0"
          cadence="forever"
          features={FREE_FEATURES}
          cta={
            <Link
              to="/"
              className="block w-full rounded-full border border-surface-border py-2.5 text-center font-display uppercase tracking-wide text-text hover:border-primary"
            >
              Start watching
            </Link>
          }
        />
        <PlanCard
          name="Pro"
          price="$6"
          cadence="/ month"
          featured
          features={PRO_FEATURES}
          cta={
            <button
              type="button"
              disabled
              className="w-full cursor-not-allowed rounded-full bg-primary/40 py-2.5 text-center font-display uppercase tracking-wide text-black/60"
            >
              Coming soon
            </button>
          }
        />
      </div>

      <p className="mt-8 text-xs text-text-dim">
        Pro isn't open yet, this is a preview of where Playbook is headed. Everything today is free.
      </p>
    </div>
  );
}
