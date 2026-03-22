"use client";

/**
 * HERMES WORKSPACE — LOADING SCREEN
 * Drop-in component shown while the 3D model loads.
 *
 * Usage in page.tsx:
 *   import { LoadingScreen } from "@/components/LoadingScreen";
 *
 *   const [modelReady, setModelReady] = useState(false);
 *   // call setModelReady(true) inside the GLTFLoader success callback
 *
 *   <AnimatePresence>
 *     {!modelReady && <LoadingScreen />}
 *   </AnimatePresence>
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

// ─── Star Field (same as main page, self-contained) ───────────────────────────
function Stars() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    let raf: number,
      t0 = 0;
    type Star = {
      x: number;
      y: number;
      r: number;
      a: number;
      tw: number;
      ts: number;
    };
    const stars: Star[] = [];
    const resize = () => {
      c.width = innerWidth;
      c.height = innerHeight;
    };
    const seed = () => {
      stars.length = 0;
      const n = Math.floor((c.width * c.height) / 4000);
      for (let i = 0; i < n; i++)
        stars.push({
          x: Math.random() * c.width,
          y: Math.random() * c.height,
          r: Math.random() * 0.7 + 0.1,
          a: Math.random() * 0.5 + 0.1,
          tw: Math.random() * Math.PI * 2,
          ts: Math.random() * 0.002 + 0.0004,
        });
    };
    const draw = (t: number) => {
      ctx.clearRect(0, 0, c.width, c.height);
      for (const s of stars) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(230,230,230,${s.a * (Math.sin(t * s.ts + s.tw) * 0.2 + 0.8)})`;
        ctx.fill();
      }
    };
    const loop = (ts: number) => {
      if (!t0) t0 = ts;
      draw(ts - t0);
      raf = requestAnimationFrame(loop);
    };
    resize();
    seed();
    raf = requestAnimationFrame(loop);
    window.addEventListener("resize", () => {
      resize();
      seed();
    });
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <canvas
      ref={ref}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}

// ─── Orbital Ring Animation ───────────────────────────────────────────────────
function OrbitalRings() {
  return (
    <div style={{ position: "relative", width: 120, height: 120 }}>
      {/* Outer ring — slow */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        style={{
          position: "absolute",
          inset: 0,
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "50%",
          borderTopColor: "rgba(255,255,255,0.45)",
        }}
      />
      {/* Middle ring — medium, opposite */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        style={{
          position: "absolute",
          inset: 14,
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "50%",
          borderRightColor: "rgba(255, 185, 50, 0.6)",
        }}
      />
      {/* Inner ring — fast */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
        style={{
          position: "absolute",
          inset: 28,
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "50%",
          borderBottomColor: "rgba(180, 200, 255, 0.5)",
        }}
      />
      {/* Centre dot */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#ffffff",
            boxShadow:
              "0 0 12px rgba(255,255,255,0.8), 0 0 28px rgba(255,255,255,0.3)",
          }}
        />
      </div>
    </div>
  );
}

// ─── Transmission Bar ─────────────────────────────────────────────────────────
function TransmissionBar({ progress }: { progress: number }) {
  return (
    <div
      style={{ width: 200, display: "flex", flexDirection: "column", gap: 8 }}
    >
      {/* Track */}
      <div
        style={{
          height: 1,
          background: "rgba(255,255,255,0.1)",
          borderRadius: 1,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <motion.div
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            background:
              "linear-gradient(90deg, rgba(255,255,255,0.6), rgba(255,185,50,0.8))",
            boxShadow: "0 0 8px rgba(255,185,50,0.4)",
          }}
        />
        {/* Shimmer sweep */}
        <motion.div
          animate={{ x: ["-100%", "400%"] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            width: "30%",
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
          }}
        />
      </div>
      {/* Labels */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Initialising
        </span>
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            color: "rgba(255,255,255,0.45)",
            letterSpacing: "0.06em",
          }}
        >
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}

// ─── Floating Particles ───────────────────────────────────────────────────────
function FloatingParticles() {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: 20 + ((i * 7) % 60),
    delay: i * 0.3,
    duration: 3 + (i % 4),
    size: i % 3 === 0 ? 2 : 1.5,
  }));

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            bottom: "30%",
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: "#ffffff",
          }}
        />
      ))}
    </div>
  );
}

// ─── Loading Screen ───────────────────────────────────────────────────────────
export function LoadingScreen({ progress }: { progress: number }) {
  return (
    <motion.div
      key="loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        background: "#090909",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Stars />
      <FloatingParticles />

      {/* Top-left brand mark */}
      <div
        style={{
          position: "absolute",
          top: 24,
          left: "clamp(20px, 5vw, 72px)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          zIndex: 2,
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 0 0 1px rgba(255,255,255,0.15)",
          }}
        >
          <Image
            src="/Square-Logo-BW-midwhite.png"
            alt="Hermes Logo"
            height={40}
            width={40}
            style={{
              objectFit: "contain",
              display: "block",
            }}
          />
        </div>
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 14,
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: "-0.01em",
          }}
        >
          Hermes Workspace
        </span>
      </div>

      {/* Centre content */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 40,
        }}
      >
        <OrbitalRings />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
          }}
        >
          <p
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              color: "rgba(255,255,255,0.45)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            LOADING WORKSPACE
          </p>
        </div>
      </div>

      {/* Bottom label */}
      <div
        style={{
          position: "absolute",
          bottom: 28,
          fontFamily: "'DM Mono', monospace",
          fontSize: 10,
          color: "rgba(255,255,255,0.2)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          zIndex: 2,
        }}
      >
        hermesworkspace.com
      </div>
    </motion.div>
  );
}
