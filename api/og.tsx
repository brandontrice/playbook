import { ImageResponse } from "@vercel/og";

// Edge runtime (not the Node runtime api/chat.ts uses), ImageResponse needs
// it. Generates a film-still + title + beat-count share card per concept,
// e.g. /api/og?title=...&thumb=...&beats=3, called from the meta-tag
// injection in api/_middleware.ts.
export const config = { runtime: "edge" };

export default function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") ?? "Playbook";
  const summary = searchParams.get("summary") ?? "";
  const thumb = searchParams.get("thumb") ?? "";
  const beats = searchParams.get("beats") ?? "0";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#131211",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        {thumb && (
          <img
            src={thumb}
            alt=""
            width={1200}
            height={630}
            style={{ position: "absolute", inset: 0, objectFit: "cover", opacity: 0.55 }}
          />
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(0deg, rgba(19,18,17,0.97) 15%, rgba(19,18,17,0.4) 65%, rgba(19,18,17,0.75) 100%)",
            display: "flex",
          }}
        />
        <div style={{ position: "absolute", top: 48, left: 56, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ color: "#f5f0e8", fontSize: 28, fontWeight: 700, letterSpacing: 1 }}>PLAYBOOK</div>
        </div>
        <div style={{ position: "absolute", bottom: 56, left: 56, right: 56, display: "flex", flexDirection: "column" }}>
          <div
            style={{
              color: "#ffc300",
              fontSize: 22,
              fontWeight: 700,
              marginBottom: 12,
              display: "flex",
            }}
          >
            {beats} BEAT BREAKDOWN
          </div>
          <div style={{ color: "#f5f0e8", fontSize: 58, fontWeight: 700, lineHeight: 1.05, display: "flex" }}>
            {title}
          </div>
          {summary && (
            <div style={{ color: "#c9c2b8", fontSize: 26, marginTop: 16, display: "flex", maxWidth: 900 }}>
              {summary}
            </div>
          )}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
