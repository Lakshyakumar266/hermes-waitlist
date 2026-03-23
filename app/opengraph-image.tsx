import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "row",
        background: "#090909",
        color: "white",
        fontFamily: "sans-serif",
        position: "relative",
      }}
    >
      {/* background glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 75% 40%, rgba(255,255,255,0.08), transparent 60%), radial-gradient(circle at 80% 60%, rgba(255,200,120,0.08), transparent 60%)",
        }}
      />

      {/* LEFT TEXT */}
      <div
        style={{
          width: "55%",
          padding: "60px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "20px",
          zIndex: 2,
        }}
      >
        {/* logo */}
        <img
          src="https://www.hermesworkspace.com/icon.png"
          width={64}
          height={64}
          style={{ borderRadius: 12 }}
        />

        {/* title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            lineHeight: 1.05,
          }}
        >
          Hermes Workspace
        </div>

        {/* tagline */}
        <div
          style={{
            fontSize: 36,
            fontWeight: 600,
            color: "#d0d0d0",
            lineHeight: 1.2,
          }}
        >
          One workspace for every message,
          <br />
          every decision.
        </div>

        {/* subtext */}
        <div
          style={{
            fontSize: 18,
            color: "#888",
            marginTop: "10px",
          }}
        >
          All-in-one communication & management platform
        </div>
      </div>

      {/* RIGHT VISUAL */}
      <div
        style={{
          width: "45%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2,
        }}
      >
        <img
          src="https://www.hermesworkspace.com/og-model.png"
          width={420}
          height={420}
          style={{
            objectFit: "contain",
          }}
        />
      </div>
    </div>,
    { ...size },
  );
}
