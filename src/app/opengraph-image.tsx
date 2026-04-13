import { ImageResponse } from "next/og";

import { siteConfig } from "@/config/site";

export const alt = `${siteConfig.name} social card`;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  const wordmark = `${siteConfig.logoLabelPrimary}${siteConfig.logoLabelSecondary}`;
  const colorSplit = "71.5%";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "56px",
          background: "linear-gradient(160deg, #060606 0%, #111111 55%, #1a1a1a 100%)",
          color: "#ffffff",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 36,
            width: "100%",
            maxWidth: "1060px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              borderRadius: 26,
              overflow: "hidden",
              boxShadow: "0 24px 54px rgba(0,0,0,0.4)",
              background: `linear-gradient(90deg, #000000 0%, #000000 ${colorSplit}, ${siteConfig.brandRed} ${colorSplit}, ${siteConfig.brandRed} 100%)`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                color: "#ffffff",
                fontSize: 72,
                fontWeight: 900,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                padding: "24px 34px",
              }}
            >
              {wordmark}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              width: "100%",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#ff5a66",
            }}
          >
            Breaking Updates Right Now
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              width: "100%",
              maxWidth: "980px",
              fontSize: 60,
              lineHeight: 1.08,
              fontWeight: 800,
              textAlign: "center",
              color: "#f3f3f3",
            }}
          >
            Live coverage, fast reporting, and social-first publishing from {siteConfig.name}.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
