import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export function useUserProgress(userId?: string) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [dates, setDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    if (!userId) {
      setCompletedIds(new Set());
      setDates([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("user_progress")
      .select("concept_id, completed_at")
      .eq("user_id", userId)
      .eq("status", "known");
    setCompletedIds(new Set((data ?? []).map((r) => r.concept_id)));
    setDates([...new Set((data ?? []).map((r) => r.completed_at).filter(Boolean).map((d) => (d as string).slice(0, 10)))]);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return { completedIds, dates, loading, refresh };
}

// Doesn't stomp completed_at on repeat calls (rewatching an already-known
// concept shouldn't move its original completion date).
export async function markConceptComplete(userId: string, conceptId: string) {
  const { data: existing } = await supabase
    .from("user_progress")
    .select("completed_at")
    .eq("user_id", userId)
    .eq("concept_id", conceptId)
    .maybeSingle();

  await supabase.from("user_progress").upsert(
    {
      user_id: userId,
      concept_id: conceptId,
      status: "known",
      completed_at: existing?.completed_at ?? new Date().toISOString(),
    },
    { onConflict: "user_id,concept_id" },
  );
}

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

// A daily streak derived from distinct completion dates rather than a
// maintained counter, so it can never drift out of sync with the actual
// user_progress rows.
export function computeStreak(dates: string[]): { current: number; longest: number } {
  const unique = [...new Set(dates)].sort();
  if (unique.length === 0) return { current: 0, longest: 0 };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < unique.length; i++) {
    run = daysBetween(unique[i - 1], unique[i]) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  const today = toDateStr(new Date());
  const yesterday = toDateStr(new Date(Date.now() - 86_400_000));
  const last = unique[unique.length - 1];
  const current = last === today || last === yesterday ? run : 0;

  return { current, longest };
}
