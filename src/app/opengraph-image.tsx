import { ImageResponse } from "next/og";

import { siteConfig } from "@/config/site";

export const alt = `${siteConfig.name} social card`;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "54px 62px",
          background:
            "linear-gradient(135deg, #ffffff 0%, #f7f1f1 42%, #f5d8da 100%)",
          color: "#111111",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 22,
          }}
        >
          <div
            style={{
              width: 84,
              height: 84,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 999,
              background: "#b30d16",
              color: "#ffffff",
              fontSize: 38,
              fontWeight: 900,
            }}
          >
            R
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 48, fontWeight: 900 }}>Redwire Daily</div>
            <div
              style={{
                fontSize: 18,
                letterSpacing: 6,
                textTransform: "uppercase",
                color: "#6a6a6a",
              }}
            >
              Fast Reporting. Clean Signal.
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: 5,
              textTransform: "uppercase",
              color: "#b30d16",
            }}
          >
            Breaking News and Digital Coverage
          </div>
          <div
            style={{
              maxWidth: 880,
              fontSize: 74,
              lineHeight: 1.02,
              fontWeight: 900,
            }}
          >
            Modern newsroom publishing for fast-moving stories, video, and search.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
