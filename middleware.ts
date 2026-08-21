// Vercel Edge Middleware. This is a client-rendered SPA with one static
// index.html, so a link shared from /concepts/some-slug would otherwise
// show a generic "Playbook" preview for every concept. This intercepts
// just the concept routes, fetches that concept's title/summary/clip from
// Supabase (the public anon key, same one the browser already uses), and
// injects real per-concept <meta> tags (including an og:image pointing at
// api/og.tsx's generated card) into the HTML before it reaches the
// requester, so link previews in Slack/Discord/iMessage/Twitter etc. show
// the actual concept instead of a generic card.
export const config = {
  matcher: "/concepts/:slug*",
};

const SUPABASE_URL = "https://dbjdxbnfgnyrokfxzddp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_BVkSg-5a3K6XE4_ZtgPesQ_wJCL5Zzi";

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function supabaseGet(path: string): Promise<any[] | null> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  if (!res.ok) return null;
  return (await res.json()) as any[];
}

export default async function middleware(request: Request) {
  const url = new URL(request.url);
  const match = url.pathname.match(/^\/concepts\/([^/]+)\/?$/);
  // matcher already scopes this middleware to /concepts/:slug*, this is a
  // defensive fallback for any shape that doesn't fit (e.g. a bare
  // trailing slash), proxy straight through unmodified.
  if (!match) return fetch(request);

  const slug = match[1];
  const originResponse = await fetch(request);
  const html = await originResponse.text();

  try {
    const concepts = await supabaseGet(`concepts?slug=eq.${encodeURIComponent(slug)}&select=id,title,summary`);
    const concept = concepts?.[0];
    if (!concept) throw new Error("concept not found");

    const breakdowns =
      (await supabaseGet(`breakdowns?concept_id=eq.${concept.id}&select=beats,clip_id`)) ?? [];
    const beatCount = breakdowns.reduce(
      (n: number, b: { beats?: unknown[] }) => n + (Array.isArray(b.beats) ? b.beats.length : 0),
      0,
    );

    let thumb = "";
    const clipId = breakdowns[0]?.clip_id;
    if (clipId) {
      const clips = await supabaseGet(`clips?id=eq.${clipId}&select=youtube_id`);
      if (clips?.[0]?.youtube_id) thumb = `https://img.youtube.com/vi/${clips[0].youtube_id}/hqdefault.jpg`;
    }

    const title = concept.title as string;
    const summary = (concept.summary as string) ?? "";
    const ogImageUrl = `${url.origin}/api/og?title=${encodeURIComponent(title)}&summary=${encodeURIComponent(
      summary,
    )}&thumb=${encodeURIComponent(thumb)}&beats=${beatCount}`;
    const pageUrl = `${url.origin}${url.pathname}`;

    const tags = [
      `<title>${escapeHtml(title)} | Playbook</title>`,
      `<meta name="description" content="${escapeHtml(summary)}" />`,
      `<meta property="og:title" content="${escapeHtml(title)}" />`,
      `<meta property="og:description" content="${escapeHtml(summary)}" />`,
      `<meta property="og:image" content="${ogImageUrl}" />`,
      `<meta property="og:url" content="${pageUrl}" />`,
      `<meta property="og:type" content="website" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
      `<meta name="twitter:description" content="${escapeHtml(summary)}" />`,
      `<meta name="twitter:image" content="${ogImageUrl}" />`,
    ].join("\n    ");

    const injected = html.replace(/<title>.*?<\/title>/s, "").replace("</head>", `    ${tags}\n  </head>`);

    const headers = new Headers(originResponse.headers);
    headers.delete("content-length");

    return new Response(injected, { status: originResponse.status, headers });
  } catch {
    // Anything goes wrong, fall back to the original page rather than
    // breaking navigation over a share-card nicety.
    const headers = new Headers(originResponse.headers);
    return new Response(html, { status: originResponse.status, headers });
  }
}
