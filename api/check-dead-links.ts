import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// Run by Vercel Cron (see vercel.json), on the Hobby plan's 10s function
// budget, so oEmbed checks run with bounded concurrency rather than one at
// a time, and the clip list isn't unbounded either.
const CONCURRENCY = 8;
const MAX_CLIPS_PER_RUN = 300;

async function isAlive(youtubeId: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${youtubeId}`)}&format=json`,
    );
    return res.ok;
  } catch {
    // A network hiccup shouldn't get a clip marked dead, only a real oEmbed
    // rejection (private/deleted/geo-blocked) should.
    return true;
  }
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Vercel Cron sends this bearer token automatically when CRON_SECRET is
  // set as an env var, which also doubles as auth against anyone else
  // hitting this endpoint directly.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    res.status(500).json({ error: "not configured" });
    return;
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: clips } = await supabase
    .from("clips")
    .select("id, youtube_id")
    .eq("status", "active")
    .limit(MAX_CLIPS_PER_RUN);

  const checked = clips ?? [];
  const alive = await mapWithConcurrency(checked, CONCURRENCY, (c) => isAlive(c.youtube_id));
  const deadIds = checked.filter((_, i) => !alive[i]).map((c) => c.id);

  if (deadIds.length > 0) {
    await supabase.from("clips").update({ status: "dead" }).in("id", deadIds);
  }

  res.status(200).json({ checked: checked.length, marked_dead: deadIds.length, dead_ids: deadIds });
}
