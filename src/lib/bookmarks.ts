import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export function useBookmarks(userId?: string) {
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  async function refresh() {
    if (!userId) {
      setBookmarkedIds(new Set());
      setLoading(false);
      return;
    }
    const { data } = await supabase.from("bookmarks").select("concept_id").eq("user_id", userId);
    setBookmarkedIds(new Set((data ?? []).map((r) => r.concept_id)));
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return { bookmarkedIds, loading, refresh };
}

export async function toggleBookmark(userId: string, conceptId: string, currentlyBookmarked: boolean) {
  if (currentlyBookmarked) {
    await supabase.from("bookmarks").delete().eq("user_id", userId).eq("concept_id", conceptId);
  } else {
    await supabase.from("bookmarks").insert({ user_id: userId, concept_id: conceptId });
  }
}
