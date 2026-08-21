// Vercel Edge Middleware, handles two SEO/share concerns for this
// client-rendered SPA (one static index.html, so neither of these can be
// done as a plain static file or component):
//
// 1. /concepts/:slug gets real per-concept <meta>/OG tags plus a
//    schema.org VideoObject JSON-LD block injected into the HTML before it
//    reaches the requester, so link previews (Slack/Discord/iMessage/
//    Twitter) and search engines see the actual concept instead of one
//    generic card/description for the whole site.
// 2. /sitemap.xml is generated on request from the live concept list,
//    instead of a static file that would silently drift out of date.
export const config = {
  matcher: ["/concepts/:slug*", "/sitemap.xml"],
};

const SUPABASE_URL = "https://dbjdxbnfgnyrokfxzddp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_BVkSg-5a3K6XE4_ZtgPesQ_wJCL5Zzi";

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escapeXml(s: string) {
  return escapeHtml(s).replace(/'/g, "&apos;");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function supabaseGet(path: string): Promise<any[] | null> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  if (!res.ok) return null;
  return (await res.json()) as any[];
}

async function handleSitemap(origin: string): Promise<Response> {
  const concepts = (await supabaseGet("concepts?select=slug,updated_at")) ?? [];
  const urls = [
    `<url><loc>${origin}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
    `<url><loc>${origin}/pricing</loc><changefreq>monthly</changefreq><priority>0.3</priority></url>`,
    ...concepts.map((c) => {
      const lastmod = c.updated_at ? `<lastmod>${new Date(c.updated_at).toISOString().slice(0, 10)}</lastmod>` : "";
      return `<url><loc>${origin}/concepts/${escapeXml(c.slug)}</loc>${lastmod}<changefreq>weekly</changefreq><priority>0.8</priority></url>`;
    }),
  ].join("\n  ");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  ${urls}\n</urlset>\n`;

  return new Response(xml, {
    status: 200,
    headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}

async function handleConcept(request: Request, url: URL, slug: string): Promise<Response> {
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
    let youtubeId = "";
    const clipId = breakdowns[0]?.clip_id;
    if (clipId) {
      const clips = await supabaseGet(`clips?id=eq.${clipId}&select=youtube_id`);
      youtubeId = clips?.[0]?.youtube_id ?? "";
      if (youtubeId) thumb = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
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
    ];

    if (youtubeId) {
      const jsonLd = {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name: title,
        description: summary || title,
        thumbnailUrl: thumb,
        uploadDate: new Date().toISOString().slice(0, 10),
        embedUrl: `https://www.youtube.com/embed/${youtubeId}`,
      };
      tags.push(`<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`);
    }

    const injected = html.replace(/<title>.*?<\/title>/s, "").replace("</head>", `    ${tags.join("\n    ")}\n  </head>`);

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

export default async function middleware(request: Request) {
  const url = new URL(request.url);

  if (url.pathname === "/sitemap.xml") {
    return handleSitemap(url.origin);
  }

  const match = url.pathname.match(/^\/concepts\/([^/]+)\/?$/);
  // matcher already scopes this middleware to /concepts/:slug* and
  // /sitemap.xml, this is a defensive fallback for any shape that doesn't
  // fit (e.g. a bare trailing slash), proxy straight through unmodified.
  if (!match) return fetch(request);

  return handleConcept(request, url, match[1]);
}
