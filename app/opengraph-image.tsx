import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";

// ✅ convert local images → base64
function getBase64(file: string) {
  const filePath = path.join(process.cwd(), "public", file);

  const data = fs.readFileSync(filePath);
  return `data:image/png;base64,${data.toString("base64")}`;
}

const icon = getBase64("icon.png");
const model = getBase64("og-model.png");

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        flexDirection: "row",
        background:
          "radial-gradient(circle at 75% 40%, rgba(255,255,255,0.08), transparent 60%), radial-gradient(circle at 80% 60%, rgba(255,200,120,0.08), transparent 60%), #090909",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      {/* LEFT */}
      <div
        style={{
          width: "55%",
          padding: "60px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "20px",
        }}
      >
        <img src={icon} width={64} height={64} />

        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            lineHeight: 1.05,
          }}
        >
          Hermes Workspace
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 36,
            fontWeight: 600,
            color: "#d0d0d0",
            lineHeight: 1.2,
          }}
        >
          <span>One workspace for every message,</span>
          <span>every decision.</span>
        </div>

        <div
          style={{
            fontSize: 18,
            color: "#888",
          }}
        >
          All-in-one communication & management platform
        </div>
        <div
          style={{
            marginTop: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            padding: "10px 18px",
            borderRadius: "8px",
            background: "rgba(255,255,255,0.08)",
            fontSize: 18,
            fontWeight: 500,
          }}
        >
          Join the waitlist →
        </div>
      </div>

      {/* RIGHT */}
      <div
        style={{
          width: "45%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src={model}
          width={420}
          height={420}
          style={{ objectFit: "contain" }}
        />
      </div>
    </div>,
    { ...size },
  );
}
