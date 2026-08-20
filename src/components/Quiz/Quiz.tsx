import { useState } from "react";
import type { QuizItem } from "../../types";

export function Quiz({ items }: { items: QuizItem[] }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  if (items.length === 0) {
    return <p className="text-text-dim">No quiz questions for this concept yet.</p>;
  }

  const item = items[index];
  const done = index >= items.length;

  if (done) {
    return (
      <div className="rounded-[var(--radius-pb)] border border-surface-border bg-surface p-6 text-center">
        <p className="font-display text-2xl">
          {score}/{items.length}
        </p>
        <p className="text-text-dim">nice work</p>
      </div>
    );
  }

  function choose(i: number) {
    setSelected(i);
    if (i === item.answer_idx) setScore((s) => s + 1);
  }

  function next() {
    setSelected(null);
    setIndex((i) => i + 1);
  }

  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius-pb)] border border-surface-border bg-surface p-4">
      <p className="text-xs text-text-dim">
        {index + 1} / {items.length}
      </p>
      <p className="font-display text-lg">{item.prompt}</p>
      <div className="flex flex-col gap-2">
        {item.choices.map((choice, i) => {
          const isCorrect = i === item.answer_idx;
          const isSelected = i === selected;
          const showState = selected !== null;
          return (
            <button
              key={i}
              type="button"
              disabled={selected !== null}
              onClick={() => choose(i)}
              className={`rounded-lg border px-4 py-2 text-left transition-colors ${
                showState && isCorrect
                  ? "border-accent-2 bg-accent-2/20"
                  : showState && isSelected
                    ? "border-accent bg-accent/10"
                    : "border-surface-border hover:border-primary"
              }`}
            >
              {choice}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <button
          type="button"
          onClick={next}
          className="w-fit rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-black"
        >
          Next →
        </button>
      )}
    </div>
  );
}
