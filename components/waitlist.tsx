"use client";

/**
 * HERMES WORKSPACE — WAITLIST PAGE (Next.js / TypeScript)
 * ─────────────────────────────────────────────────────────────────────────────
 * npm install framer-motion gsap three @types/three @tabler/icons-react
 *
 * app/layout.tsx <head>:
 *   <link rel="preconnect" href="https://fonts.googleapis.com" />
 *   <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
 *   <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap" rel="stylesheet" />
 *
 * 3D Model → drop any .glb at: public/model.glb
 * Free models: poly.pizza · market.pmnd.rs · sketchfab.com
 *
 * globals.css:
 *   body { margin: 0; background: #090909; }
 */

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
  type Transition,
} from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  IconBrandTelegram,
  IconMessages,
  IconUsers,
  IconBolt,
  IconWorld,
  IconShieldLock,
  IconChartBar,
  IconBell,
  IconArrowRight,
  IconCircleCheckFilled,
  IconDeviceMobile,
  IconWifi,
  IconCheck,
} from "@tabler/icons-react";
import Image from "next/image";

gsap.registerPlugin(ScrollTrigger);

// ─── Color Tokens ─────────────────────────────────────────────────────────────
// Rule: NOTHING below #555 is used for text or icons on black background.
// Use #888 minimum for secondary text, #aaa for primary secondary, #e8e8e8 for headings.
const T = {
  bg: "#090909",
  surface: "#111111",
  card: "#0f0f0f",
  border: "#262626", // visible on black
  border2: "#333333", // slightly lighter for hover
  white: "#e8e8e8", // primary text — not pure white, easier on eyes
  primary: "#c8c8c8", // secondary headings
  body: "#aaaaaa", // body text — clearly readable on black
  muted: "#888888", // captions, labels — min threshold for dark bg
  dim: "#666666", // only used for large text (stats sub) or decorative
  faint: "#444444", // borders, dividers only — NEVER text
  green: "#4a9e68", // accent — brighter so it reads
} as const;

type CB4 = [number, number, number, number];
const EASE: CB4 = [0.16, 1, 0.3, 1];

// ═══════════════════════════════════════════════════════════════════════════════
// STAR FIELD
// ═══════════════════════════════════════════════════════════════════════════════
function StarField() {
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
      const n = Math.floor((c.width * c.height) / 5000);
      for (let i = 0; i < n; i++)
        stars.push({
          x: Math.random() * c.width,
          y: Math.random() * c.height,
          r: Math.random() * 0.65 + 0.12,
          a: Math.random() * 0.45 + 0.12,
          tw: Math.random() * Math.PI * 2,
          ts: Math.random() * 0.002 + 0.0005,
        });
    };
    const draw = (t: number) => {
      ctx.clearRect(0, 0, c.width, c.height);
      for (const s of stars) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(230,230,230,${s.a * (Math.sin(t * s.ts + s.tw) * 0.18 + 0.82)})`;
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
    const onR = () => {
      resize();
      seed();
    };
    window.addEventListener("resize", onR);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onR);
    };
  }, []);
  return (
    <canvas
      ref={ref}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        opacity: 0.5,
      }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// THREE.JS SCENE
// ═══════════════════════════════════════════════════════════════════════════════
interface SceneProps {
  size?: number;
  meshRef?: React.MutableRefObject<THREE.Object3D | null>;
  onReady?: () => void;
  onProgress?: (pct: number) => void;
}

function ThreeScene({ size = 380, meshRef, onReady, onProgress }: SceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 3.4;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    el.appendChild(renderer.domElement);

    // ── Lighting ─────────────────────────────────────────────────────────────
    // Use multiple lights at different angles + colours for environment feel
    scene.add(new THREE.AmbientLight(0xffffff, 0.15)); // very low ambient — let shaders do the work

    // Key light — top front, warm white
    const lKey = new THREE.DirectionalLight(0xfff5e0, 2.8);
    lKey.position.set(2, 4, 3);
    scene.add(lKey);

    // Fill light — front-left, cool blue, soft
    const lFill = new THREE.DirectionalLight(0xc0d8ff, 1.2);
    lFill.position.set(-3, 1, 2);
    scene.add(lFill);

    // Rim light — behind+above, gives wing-edge separation from bg
    const lRim = new THREE.DirectionalLight(0x88aaff, 2.0);
    lRim.position.set(0, 2, -4);
    scene.add(lRim);

    // Ground bounce — below, warm, simulates reflected floor light
    const lGround = new THREE.PointLight(0xffeedd, 0.8, 10);
    lGround.position.set(0, -3, 1);
    scene.add(lGround);

    // ── Custom GLSL ShaderMaterial ────────────────────────────────────────────
    // Texture will be extracted from the GLB and injected as a uniform.
    // We create the material first with a null map, then set it after load.
    const shaderUniforms = {
      uTexture: { value: null as THREE.Texture | null },
      uHasTexture: { value: 0 },
      uTime: { value: 0 },
    };

    const vertexShader = `
      varying vec3 vNormal;
      varying vec3 vWorldPos;
      varying vec3 vViewDir;
      varying vec2 vUv;

      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos  = worldPos.xyz;
        vNormal    = normalize(normalMatrix * normal);
        vViewDir   = normalize(cameraPosition - worldPos.xyz);
        vUv        = uv;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `;

    const fragmentShader = `
      uniform sampler2D uTexture;
      uniform int uHasTexture;
      uniform float uTime;

      varying vec3 vNormal;
      varying vec3 vWorldPos;
      varying vec3 vViewDir;
      varying vec2 vUv;

      void main() {
        vec3 n = normalize(vNormal);
        vec3 v = normalize(vViewDir);

        // ── Sample texture or base colour ──
        vec3 baseColor;
        if (uHasTexture == 1) {
          vec4 tex = texture2D(uTexture, vUv);
          baseColor = tex.rgb;
        } else {
          baseColor = vec3(0.55, 0.55, 0.58);
        }

        // ── Hemisphere environment light ──
        // Sky colour from above, ground colour from below — blended by normal Y
        // This is what keeps shadow areas from going pure black
        vec3 skyColor    = vec3(0.72, 0.80, 1.0);   // cool blue-white sky
        vec3 groundColor = vec3(0.55, 0.48, 0.42);  // warm grey-brown ground bounce
        float hemi       = dot(n, vec3(0.0, 1.0, 0.0)) * 0.5 + 0.5; // 0=down, 1=up
        vec3 envLight    = mix(groundColor, skyColor, hemi) * 0.55;   // strength

        // ── Key light — warm top-front ──
        vec3 lKeyDir = normalize(vec3(2.0, 4.0, 3.0));
        float diffKey = max(dot(n, lKeyDir), 0.0);
        vec3 hKey = normalize(lKeyDir + v);
        float specKey = pow(max(dot(n, hKey), 0.0), 48.0);

        // ── Fill light — cool left ──
        vec3 lFillDir = normalize(vec3(-3.0, 1.0, 2.0));
        float diffFill = max(dot(n, lFillDir), 0.0) * 0.55;

        // ── Rim — edges away from camera ──
        float rim = pow(1.0 - max(dot(n, v), 0.0), 2.8);

        // ── Golden point light — right side ──
        vec3 goldenPos    = vec3(-3.5, 1.0, 1.5);
        vec3 goldenDir    = normalize(goldenPos - vWorldPos);
        float goldenDist  = length(goldenPos - vWorldPos);
        float goldenAtten = 1.0 / (1.0 + 0.4 * goldenDist + 0.18 * goldenDist * goldenDist);
        float diffGolden  = max(dot(n, goldenDir), 0.0);
        vec3 hGolden      = normalize(goldenDir + v);
        float specGolden  = pow(max(dot(n, hGolden), 0.0), 32.0);
        vec3 goldenColor  = vec3(1.0, 0.72, 0.12);

        // ── Assemble ──
        // Ambient base is now much higher — shadow areas stay bright
        vec3 col = baseColor * 0.52;                                   // lifted ambient
        col += baseColor * envLight;                                    // hemisphere env
        col += baseColor * vec3(1.0, 0.95, 0.85) * diffKey * 0.9;     // key diffuse
        col += baseColor * vec3(0.7, 0.82, 1.0)  * diffFill;          // fill diffuse
        col += vec3(1.0) * specKey * 0.45;                             // white specular
        col += vec3(0.45, 0.6, 1.0) * rim * 0.55;                     // blue rim
        col += vec3(1.0, 0.85, 0.7) * rim * rim * 0.15;               // warm rim
        col += baseColor * goldenColor * diffGolden * goldenAtten * 3.2; // golden diffuse
        col += goldenColor * specGolden * goldenAtten * 2.0;           // golden specular

        // Softer vertical fade — shadow floor raised from 0.4 to 0.65
        float yFade = smoothstep(-1.8, 0.2, vWorldPos.y);
        col *= mix(0.65, 1.0, yFade);

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const shaderMat = new THREE.ShaderMaterial({
      uniforms: shaderUniforms,
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
    });

    const root = new THREE.Group();
    scene.add(root);
    if (meshRef) meshRef.current = root;

    // Particle shell
    const ptGeo = new THREE.BufferGeometry();
    const ptPos = new Float32Array(200 * 3);
    for (let i = 0; i < 200; i++) {
      const θ = Math.random() * Math.PI * 2;
      const φ = Math.acos(2 * Math.random() - 1);
      const r = 1.3 + Math.random() * 0.7;
      ptPos[i * 3] = r * Math.sin(φ) * Math.cos(θ);
      ptPos[i * 3 + 1] = r * Math.sin(φ) * Math.sin(θ);
      ptPos[i * 3 + 2] = r * Math.cos(φ);
    }
    ptGeo.setAttribute("position", new THREE.BufferAttribute(ptPos, 3));
    const ptMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.014,
      transparent: true,
      opacity: 0.55,
    });
    const points = new THREE.Points(ptGeo, ptMat);
    root.add(points);

    // Orbit ring
    const ringGeo = new THREE.TorusGeometry(1.6, 0.004, 8, 128);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.12,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.3;
    root.add(ring);

    // GLB or fallback
    type Disposable = {
      geometry: THREE.BufferGeometry;
      material: THREE.Material | THREE.Material[];
    };
    let fallbackItems: Disposable[] = [];
    let gltfRoot: THREE.Group | null = null;

    const buildFallback = () => {
      const g1 = new THREE.IcosahedronGeometry(1, 3);
      const w1 = new THREE.WireframeGeometry(g1);
      const m1 = new THREE.LineBasicMaterial({
        color: 0xdddddd,
        transparent: true,
        opacity: 0.18,
      });
      const s1 = new THREE.LineSegments(w1, m1);
      const g2 = new THREE.IcosahedronGeometry(0.58, 2);
      const w2 = new THREE.WireframeGeometry(g2);
      const m2 = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.08,
      });
      const s2 = new THREE.LineSegments(w2, m2);
      root.add(s1, s2);
      fallbackItems = [
        { geometry: w1, material: m1 },
        { geometry: w2, material: m2 },
      ];
      g1.dispose();
      g2.dispose();
      onReady?.();
    };

    const loader = new GLTFLoader();
    loader.load(
      "/model.glb",
      (gltf) => {
        // ── Step 1: Extract the first texture found in the model ──
        // The GLB bakes textures into mesh materials. We pull the map out
        // before we replace the material, then inject it into our shader.
        let extractedTexture: THREE.Texture | null = null;

        gltf.scene.traverse((child) => {
          if ((child as THREE.Mesh).isMesh && !extractedTexture) {
            const mat = (child as THREE.Mesh).material;
            // Handle both single material and array of materials
            const mats = Array.isArray(mat) ? mat : [mat];
            for (const m of mats) {
              const std = m as THREE.MeshStandardMaterial;
              // Try common texture slots: map (albedo), emissiveMap, etc.
              const tex = std.map ?? std.emissiveMap ?? std.normalMap ?? null;
              if (tex) {
                extractedTexture = tex;
                break;
              }
            }
          }
        });

        // ── Step 2: Inject texture into shader uniforms ──
        if (extractedTexture) {
          shaderUniforms.uTexture.value = extractedTexture;
          shaderUniforms.uHasTexture.value = 1;
        }

        // ── Step 3: Apply custom shader to every mesh ──
        gltf.scene.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            (child as THREE.Mesh).material = shaderMat;
          }
        });

        // Auto-scale to fit scene
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const sph = box.getBoundingSphere(new THREE.Sphere());
        // Scale up — increase from 1.3 to 1.6
        const sc = 2.0 / sph.radius;
        gltf.scene.scale.setScalar(sc);
        gltf.scene.position.sub(sph.center.multiplyScalar(sc));
        // Shift model up so it sits higher in the canvas
        gltf.scene.position.y += 0.15;

        // Fix orientation: was facing right → rotate -90° on Y
        gltf.scene.rotation.y = -Math.PI / 2;
        gltf.scene.rotation.x = -0.08;

        root.add(gltf.scene);
        gltfRoot = gltf.scene;
        onReady?.();
      },
      (xhr) => {
        if (xhr.total > 0) onProgress?.((xhr.loaded / xhr.total) * 100);
      },

      () => buildFallback(),
    );

    let tx = 0,
      ty = 0,
      cx2 = 0,
      cy2 = 0;
    const onMouse = (e: MouseEvent) => {
      tx = (e.clientX / innerWidth - 0.5) * 0.75;
      ty = (e.clientY / innerHeight - 0.5) * 0.75;
    };
    window.addEventListener("mousemove", onMouse);

    const CLAMP = 10 * (Math.PI / 180); // 10 degrees in radians

    let raf: number;
    const clock = new THREE.Clock();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      shaderUniforms.uTime.value = t;
      cx2 += (tx - cx2) * 0.04;
      cy2 += (ty - cy2) * 0.04;

      // Clamp to ±10° on X and Z — model never rotates to show backside
      // Y has a slow idle drift but also clamped so back never appears
      const rawX = t * 0.018 + cy2 * 0.25;
      const rawY = t * 0.06 + cx2 * 0.3;
      const rawZ = t * 0.01;

      root.rotation.x = Math.max(-CLAMP, Math.min(CLAMP, rawX));
      root.rotation.y = Math.max(-CLAMP, Math.min(CLAMP, rawY));
      root.rotation.z = Math.max(-CLAMP, Math.min(CLAMP, rawZ));

      points.rotation.y = t * 0.04;
      ring.rotation.z = t * 0.06;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouse);
      renderer.dispose();
      shaderMat.dispose();
      ptGeo.dispose();
      ptMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      fallbackItems.forEach((f) => {
        f.geometry.dispose();
        if (Array.isArray(f.material)) f.material.forEach((m) => m.dispose());
        else f.material.dispose();
      });
      if (gltfRoot) {
        gltfRoot.traverse((c) => {
          const m = c as THREE.Mesh;
          if (m.isMesh) {
            m.geometry.dispose();
            (Array.isArray(m.material) ? m.material : [m.material]).forEach(
              (x) => x.dispose(),
            );
          }
        });
      }
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [size, meshRef]);

  return (
    <div ref={mountRef} style={{ width: size, height: size, flexShrink: 0 }} />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BENTO CARD — Static layout, no expand/collapse
// Shows title + description + bullets always. Hover = glow lift only.
// This keeps page height stable and works on mobile/touch.
// ═══════════════════════════════════════════════════════════════════════════════
interface CardData {
  icon: ReactNode;
  title: string;
  description: string;
  bullets: string[];
  cols?: 1 | 2;
  accent?: boolean;
}

// Grid layout — 4 columns, each row must sum to 4:
// Row 1: [1] + [1] + [2✦] = 4  ← Real-time is accent wide card
// Row 2: [1] + [1] + [1] + [1] = 4
// Row 3: [1] + [1] + [1] + [1] = 4
// Row 4: [2] + [2] = 4  ← last row perfectly filled
const CARDS: CardData[] = [
  // ── Row 1 ──
  {
    icon: <IconMessages size={20} stroke={1.4} />,
    title: "Unified messaging",
    description:
      "One inbox for everything — class announcements, direct messages, group threads. No more WhatsApp groups.",
    bullets: [
      "Class-specific channels",
      "DMs between all roles",
      "Pinned announcements",
    ],
    cols: 1,
  },
  {
    icon: <IconUsers size={20} stroke={1.4} />,
    title: "Three roles, one platform",
    description:
      "Admin manages the school, teachers run classes, students participate — each with their own purpose-built interface.",
    bullets: [
      "Role-specific dashboards",
      "Permission-controlled access",
      "Zero configuration needed",
    ],
    cols: 1,
  },
  {
    icon: <IconBolt size={20} stroke={1.4} />,
    title: "Real-time, always",
    description:
      "Live video classes, instant message delivery, and real-time attendance marking. Every action reflects for everyone instantly — no refresh, no lag.",
    bullets: [
      "Video classes up to 60 students",
      "Live polls & attendance",
      "Instant push notifications",
      "Offline queue + auto-sync",
    ],
    cols: 2,
    accent: true,
  },
  // ── Row 2 ──
  {
    icon: <IconChartBar size={20} stroke={1.4} />,
    title: "Attendance & analytics",
    description:
      "Auto-track who attended every session. See engagement at a glance and export reports for admin.",
    bullets: [
      "Auto-marked attendance",
      "Per-student engagement score",
      "Exportable admin reports",
    ],
    cols: 1,
  },
  {
    icon: <IconBell size={20} stroke={1.4} />,
    title: "Smart notifications",
    description:
      "Deadlines and live class alerts surface first. Low-priority items batch quietly. Silent hours respected.",
    bullets: [
      "Priority-ranked alerts",
      "Digest mode for low-priority",
      "Silent hours support",
    ],
    cols: 1,
  },
  {
    icon: <IconDeviceMobile size={20} stroke={1.4} />,
    title: "Mobile-first",
    description:
      "Designed for the mid-range Android in every student's pocket. Under 5 MB, fast, touch-optimised.",
    bullets: ["< 5 MB app size", "Touch-optimised UI", "Android 9+ support"],
    cols: 1,
  },
  {
    icon: <IconWifi size={20} stroke={1.4} />,
    title: "Low-bandwidth mode",
    description:
      "Switches to text-only automatically on slow data. Messages queue offline and sync the moment connection returns.",
    bullets: [
      "Works on 2G connections",
      "Offline message queue",
      "Auto-sync on reconnect",
    ],
    cols: 1,
  },
  // ── Row 3: two wide cards fill 2+2=4 perfectly ──
  {
    icon: <IconWorld size={20} stroke={1.4} />,
    title: "Built for India",
    description:
      "India-hosted infrastructure, 10+ regional languages, and pricing designed for Indian institutions — from government schools to private chains. Low latency everywhere.",
    bullets: [
      "10+ regional languages",
      "India-hosted low-latency servers",
      "From ₹0 per student",
      "CBSE, ICSE, State board ready",
    ],
    cols: 2,
  },
  {
    icon: <IconShieldLock size={20} stroke={1.4} />,
    title: "School-grade privacy",
    description:
      "DPDP Act compliant. No ads, no third-party trackers. Every school gets fully isolated data — your institution's information never touches anyone else's.",
    bullets: [
      "DPDP Act compliant",
      "Zero third-party data sharing",
      "Full institutional isolation",
      "No ads, ever",
    ],
    cols: 2,
  },
];

function BentoCard({
  icon,
  title,
  description,
  bullets,
  accent = false,
  index = 0,
}: Omit<CardData, "cols"> & { index?: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      animate={{ y: hovered ? -2 : 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      style={{
        background: accent ? "#0d0d0d" : T.card,
        padding: "32px 28px 36px",
        position: "relative",
        overflow: "hidden",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 0,
        borderRight: `1px solid ${T.border}`,
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      {/* Hover bg glow */}
      <motion.div
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse 90% 60% at 30% 20%, #ffffff07, transparent 70%)",
        }}
      />

      {/* Animated top-left accent line */}
      <motion.div
        animate={{ width: hovered ? "40%" : "0%" }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: 1,
          background: `linear-gradient(90deg, ${T.border2}, transparent)`,
          pointerEvents: "none",
        }}
      />

      {/* Card number — decorative top-right */}
      <span
        style={{
          position: "absolute",
          top: 20,
          right: 22,
          fontFamily: "'DM Mono', monospace",
          fontSize: 10,
          color: T.faint,
          letterSpacing: "0.08em",
          userSelect: "none",
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </span>

      {/* Large icon block */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 10,
          border: `1px solid ${T.border}`,
          background: accent ? "#141414" : "#111111",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 22,
          flexShrink: 0,
          transition: "border-color 0.2s",
          borderColor: hovered ? T.border2 : T.border,
        }}
      >
        <motion.div
          animate={{ scale: hovered ? 1.15 : 1, rotate: hovered ? 6 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
          style={{ color: hovered ? T.white : T.muted, display: "flex" }}
        >
          {icon}
        </motion.div>
      </div>

      {/* Title */}
      <p
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 15,
          fontWeight: 700,
          color: T.white,
          margin: "0 0 10px",
          lineHeight: 1.3,
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </p>

      {/* Description */}
      <p
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 13,
          color: T.body,
          lineHeight: 1.75,
          margin: "0 0 20px",
          flex: 1,
        }}
      >
        {description}
      </p>

      {/* Divider */}
      <div style={{ height: 1, background: T.border, marginBottom: 18 }} />

      {/* Bullets */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {bullets.map((b, i) => (
          <div
            key={i}
            style={{ display: "flex", alignItems: "flex-start", gap: 9 }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                background: "#1a1a1a",
                border: `1px solid ${T.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginTop: 1,
              }}
            >
              <IconCheck size={9} stroke={2.5} color={T.green} />
            </div>
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color: T.muted,
                letterSpacing: "0.02em",
                lineHeight: 1.5,
              }}
            >
              {b}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WAITLIST FORM
// ═══════════════════════════════════════════════════════════════════════════════
function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [phase, setPhase] = useState<"idle" | "sending" | "done">("idle");

  const validate = useCallback(() => {
    if (!name.trim()) return "What should we call you?";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return "Valid email required.";
    return null;
  }, [name, email]);

  const submit = async () => {
    const e = validate();
    if (e) {
      setErr(e);
      return;
    }
    setErr("");
    setPhase("sending");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErr(data.error ?? "Something went wrong.");
        setPhase("idle");
        return;
      }

      setPhase("done");
    } catch {
      setErr("Network error. Please try again.");
      setPhase("idle");
    }
  };

  const inputStyle = (hasErr: boolean): CSSProperties => ({
    width: "100%",
    padding: "12px 14px",
    background: "#0c0c0c",
    border: `1px solid ${hasErr ? "#7a3030" : T.border}`,
    borderRadius: 6,
    color: T.white,
    fontFamily: "'DM Mono', monospace",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color .15s, box-shadow .15s",
  });

  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = T.border2;
    e.currentTarget.style.boxShadow = "0 0 0 3px #ffffff09";
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = T.border;
    e.currentTarget.style.boxShadow = "none";
  };

  return (
    <AnimatePresence mode="wait">
      {phase === "done" ? (
        <motion.div
          key="done"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", alignItems: "center", gap: 14 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={
              {
                type: "spring",
                stiffness: 300,
                damping: 18,
                delay: 0.1,
              } as Transition
            }
          >
            <IconCircleCheckFilled size={26} color={T.green} />
          </motion.div>
          <div>
            <p
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 12,
                color: T.green,
                letterSpacing: "0.08em",
                marginBottom: 4,
              }}
            >
              SIGNAL RECEIVED
            </p>
            <p
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 14,
                color: T.body,
              }}
            >
              We&apos;ll reach you when Hermes goes live, {name.split(" ")[0]}.
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ display: "flex", flexDirection: "column", gap: 10 }}
        >
          <div
            className="form-row"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
          >
            <input
              style={inputStyle(!!err && !name.trim())}
              placeholder="Your name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErr("");
              }}
              onFocus={onFocus}
              onBlur={onBlur}
            />
            <input
              style={inputStyle(!!err && !email.trim())}
              placeholder="your@email.com"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErr("");
              }}
              onFocus={onFocus}
              onBlur={onBlur}
            />
          </div>

          {err && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color: "#e07070",
                margin: 0,
              }}
            >
              {err}
            </motion.p>
          )}

          <motion.button
            onClick={() => { submit(); }}
            disabled={phase === "sending"}
            whileHover={{ scale: 1.01, filter: "brightness(1.06)" }}
            whileTap={{ scale: 0.98 }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "13px 20px",
              width: "100%",
              background: phase === "sending" ? "#1e1e1e" : T.white,
              color: phase === "sending" ? T.muted : "#090909",
              border: "none",
              borderRadius: 6,
              fontFamily: "'DM Mono', monospace",
              fontSize: 13,
              fontWeight: 500,
              cursor: phase === "sending" ? "default" : "pointer",
              transition: "background .2s",
            }}
          >
            {phase === "sending" ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={
                  {
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear",
                  } as Transition
                }
                style={{ display: "inline-block" }}
              >
                ◌
              </motion.span>
            ) : (
              <>
                <IconBrandTelegram size={16} />
                <span>Join the waitlist</span>
                <IconArrowRight size={14} />
              </>
            )}
          </motion.button>

          <p
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              color: T.muted,
              margin: 0,
            }}
          >
            No spam. Just the signal when we&apos;re live.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TICKER
// ═══════════════════════════════════════════════════════════════════════════════
function Ticker() {
  const items = [
    "Unified Messaging",
    "Live Sessions",
    "School Communication",
    "Role-Based Workspaces",
    "Low Bandwidth Mode",
    "Built for India",
    "Launching Soon",
  ];
  const rep = [...items, ...items, ...items, ...items];
  return (
    <div
      style={{
        borderTop: `1px solid ${T.border}`,
        borderBottom: `1px solid ${T.border}`,
        padding: "11px 0",
        overflow: "hidden",
      }}
    >
      <motion.div
        animate={{ x: ["0%", "-33.33%"] }}
        transition={
          { duration: 30, repeat: Infinity, ease: "linear" } as Transition
        }
        style={{ display: "flex", whiteSpace: "nowrap" }}
      >
        {rep.map((item, i) => (
          <span
            key={i}
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              color: T.muted, // #888 — readable
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              flexShrink: 0,
              padding: "0 28px",
            }}
          >
            {item}
            <span style={{ marginLeft: 28, color: T.border2 }}>·</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════
interface WaitlistPageProps {
  onModelReady?: (value: boolean) => void;
  onProgress?: (pct: number) => void;
}

export default function WaitlistPage({
  onModelReady,
  onProgress,
}: WaitlistPageProps) {
  const heroRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<THREE.Object3D | null>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const rawY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const sphereY = useSpring(rawY, { stiffness: 80, damping: 22 });
  const heroOp = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  useEffect(() => {
    // Heading reveal
    document.querySelectorAll<HTMLElement>(".gsap-h").forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 24, filter: "blur(4px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 87%" },
        },
      );
    });
    // Label fade
    document.querySelectorAll<HTMLElement>(".gsap-label").forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.5,
          scrollTrigger: { trigger: el, start: "top 88%" },
        },
      );
    });
    // 3D scroll spin
    if (sceneRef.current) {
      gsap.to(sceneRef.current.rotation, {
        y: Math.PI * 1.8,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current ?? document.body,
          start: "top top",
          end: "bottom top",
          scrub: 1.8,
        },
      });
    }
    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  const PAD: CSSProperties = { padding: "0 clamp(20px, 5vw, 72px)" };
  const WRAP: CSSProperties = {
    maxWidth: 1120,
    margin: "0 auto",
    width: "100%",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #090909; color: #e8e8e8; -webkit-font-smoothing: antialiased; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: #090909; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        ::selection { background: #ffffff18; }
        input::placeholder { color: #555; }

        /* ── Responsive ─────────────────────────────────────────── */
        @media (max-width: 1020px) {
          .hero-layout  { flex-direction: column !important; min-height: auto !important; padding-top: 48px !important; padding-bottom: 60px !important; gap: 40px !important; }
          .bento-grid   { grid-template-columns: repeat(2, 1fr) !important; }
          .bento-span2  { grid-column: span 1 !important; }
          .stats-grid   { grid-template-columns: repeat(2, 1fr) !important; }
          .cta-cols     { flex-direction: column !important; }
        }
        @media (max-width: 640px) {
          .bento-grid   { grid-template-columns: 1fr !important; }
          .bento-span2  { grid-column: span 1 !important; }
          .stats-grid   { grid-template-columns: 1fr 1fr !important; }
          .form-row     { grid-template-columns: 1fr !important; }
          .sphere-hide  { display: none !important; }
        }
      `}</style>

      <div
        style={{ minHeight: "100vh", background: T.bg, position: "relative" }}
      >
        <StarField />
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(ellipse 70% 34% at 50% 0%, #ffffff04, transparent 65%)",
          }}
        />

        {/* ──────────────────────────────────────────────────────────────
            NAV
        ─────────────────────────────────────────────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 } as Transition}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            background: "rgba(9,9,9,0.9)",
            backdropFilter: "blur(20px)",
            borderBottom: `1px solid ${T.border}`,
          }}
        >
          <div
            style={{
              ...WRAP,
              ...PAD,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              height: 60,
            }}
          >
            {/* ── NAV LOGO — full brand name, equal weight, one unit ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Icon mark */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  background: "#0f0f0f",
                  border: "1px solid rgba(255,255,255,0.06)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.6)",
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
              {/* Full brand name — one unit, same weight, same color */}
              <span
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#ffffff",
                  letterSpacing: "-0.01em",
                }}
              >
                Hermes Workspace
              </span>
            </div>
            {/* Badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2.6, repeat: Infinity } as Transition}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: T.green,
                }}
              />
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                  color: T.body,
                  letterSpacing: "0.1em",
                }}
              >
                LAUNCHING SOON
              </span>
            </div>
          </div>
        </motion.header>

        {/* ──────────────────────────────────────────────────────────────
            §1 HERO
        ─────────────────────────────────────────────────────────────── */}
        <motion.section
          ref={heroRef}
          style={{
            opacity: heroOp,
            position: "relative",
            zIndex: 10,
            paddingTop: 60,
          }}
        >
          <div style={{ ...WRAP, ...PAD }}>
            <div
              className="hero-layout"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                minHeight: "calc(100vh - 60px)",
                paddingTop: 60,
                paddingBottom: 60,
                gap: 60,
              }}
            >
              {/* ── Left copy ── */}
              <div style={{ flex: 1, maxWidth: 560 }}>
                {/* ══ HERO BRAND BLOCK ══
                    Reading order: icon mark → full product name → descriptor → headline → form
                    "Hermes Workspace" is the full name — both words equal weight, white.
                ══ */}
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: EASE } as Transition}
                  style={{ marginBottom: 40 }}
                >
                  {/* Icon + name row */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      marginBottom: 14,
                    }}
                  >
                    {/* Large white icon mark */}
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        boxShadow:
                          "0 0 0 1px rgba(255,255,255,0.18), 0 8px 28px rgba(255,255,255,0.12)",
                      }}
                    >
                      <Image
                        src="/Hermes_Logo_Colour.png"
                        alt="Hermes Logo"
                        height={100}
                        width={100}
                        style={{ objectFit: "cover", display: "block" }}
                      />
                    </div>

                    {/* Full product name — one unit, both words identical weight + color */}
                    <p
                      style={{
                        fontFamily: "'Syne', sans-serif",
                        fontWeight: 800,
                        fontSize: "clamp(22px, 3vw, 32px)",
                        color: "#ffffff",
                        margin: 0,
                        letterSpacing: "-0.03em",
                        lineHeight: 1,
                      }}
                    >
                      Hermes Workspace
                    </p>
                  </div>

                  {/* Product descriptor — what it is in one line */}
                  <p
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 12,
                      color: T.muted,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      margin: 0,
                      paddingLeft: 72, // aligns under the name (56px icon + 16px gap)
                    }}
                  >
                    All-in-one communication &amp; management
                  </p>
                </motion.div>

                {/* Headline */}
                <motion.h1
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    { duration: 0.75, delay: 0.18, ease: EASE } as Transition
                  }
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    lineHeight: 1.08,
                    letterSpacing: "-0.02em",
                    margin: "0 0 20px",
                  }}
                >
                  {/* Line 1 — small, muted label weight. Sets context. */}
                  <span
                    style={{
                      display: "block",
                      fontSize: "clamp(14px, 1.4vw, 18px)",
                      fontWeight: 400,
                      color: T.muted,
                      letterSpacing: "0.01em",
                      marginBottom: 6,
                    }}
                  >
                    One workspace for
                  </span>

                  {/* Line 2 — the big statement. Dominates. */}
                  <span
                    style={{
                      display: "block",
                      fontSize: "clamp(38px, 5.2vw, 68px)",
                      fontWeight: 800,
                      color: "#ffffff",
                      letterSpacing: "-0.03em",
                      lineHeight: 1,
                      marginBottom: 8,
                    }}
                  >
                    every message,
                  </span>

                  {/* Line 3 — medium weight, slightly dimmer. Completes the thought. */}
                  <span
                    style={{
                      display: "block",
                      fontSize: "clamp(28px, 3.6vw, 48px)",
                      fontWeight: 600,
                      color: T.primary,
                      letterSpacing: "-0.025em",
                      lineHeight: 1.1,
                    }}
                  >
                    every decision.
                  </span>
                </motion.h1>

                {/* Sub — positions the product clearly */}
                <motion.p
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    { duration: 0.7, delay: 0.26, ease: EASE } as Transition
                  }
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: "clamp(14px, 1.5vw, 16px)",
                    color: T.body,
                    lineHeight: 1.8,
                    maxWidth: 420,
                    marginBottom: 40,
                  }}
                >
                  Hermes Workspace is an all-in-one communication and management
                  platform built for organisations — starting with Indian
                  schools. Messaging, announcements, live sessions, and admin
                  tools unified in one place.
                </motion.p>

                {/* Form */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    { duration: 0.7, delay: 0.34, ease: EASE } as Transition
                  }
                  style={{ maxWidth: 480 }}
                >
                  <WaitlistForm />
                </motion.div>
              </div>

              {/* ── Right: 3D ── */}
              <motion.div
                className="sphere-hide"
                style={{ y: sphereY, flexShrink: 0 }}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={
                  { duration: 1.3, delay: 0.2, ease: EASE } as Transition
                }
              >
                <ThreeScene
                  size={500}
                  meshRef={sceneRef}
                  onReady={() => onModelReady?.(true)}
                  onProgress={onProgress}
                />
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Ticker */}
        <div style={{ position: "relative", zIndex: 10 }}>
          <Ticker />
        </div>

        {/* ──────────────────────────────────────────────────────────────
            §2 BENTO GRID
        ─────────────────────────────────────────────────────────────── */}
        <section
          style={{ position: "relative", zIndex: 10, padding: "96px 0" }}
        >
          <div style={{ ...WRAP, ...PAD }}>
            <div style={{ marginBottom: 48 }}>
              <p
                className="gsap-label"
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                  color: T.muted,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  marginBottom: 14,
                }}
              >
                What&apos;s inside
              </p>
              <h2
                className="gsap-h"
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 800,
                  fontSize: "clamp(26px, 3.2vw, 44px)",
                  color: T.white,
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                }}
              >
                Everything a school needs.
                <br />
                <span style={{ color: T.primary, fontWeight: 600 }}>
                  Nothing it doesn&apos;t.
                </span>
              </h2>
            </div>

            {/* Grid — fixed columns, no reflow on hover */}
            <div
              className="bento-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                border: `1px solid ${T.border}`,
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              {CARDS.map((c, i) => (
                <motion.div
                  key={i}
                  className={c.cols === 2 ? "bento-span2" : ""}
                  style={{ gridColumn: `span ${c.cols ?? 1}` }}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={
                    {
                      duration: 0.45,
                      delay: (i % 4) * 0.07,
                      ease: EASE,
                    } as Transition
                  }
                >
                  <BentoCard {...c} index={i} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ──────────────────────────────────────────────────────────────
            §3 STATS
        ─────────────────────────────────────────────────────────────── */}
        <section
          style={{ position: "relative", zIndex: 10, padding: "0 0 96px" }}
        >
          <div style={{ ...WRAP, ...PAD }}>
            <div style={{ marginBottom: 44 }}>
              <p
                className="gsap-label"
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                  color: T.muted,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  marginBottom: 14,
                }}
              >
                By the numbers
              </p>
              <h2
                className="gsap-h"
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 800,
                  fontSize: "clamp(24px, 2.8vw, 40px)",
                  color: T.white,
                  lineHeight: 1.15,
                  letterSpacing: "-0.02em",
                }}
              >
                Clarity, not complexity.
              </h2>
            </div>

            <div
              className="stats-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "1px",
                background: T.border,
                borderRadius: 12,
                overflow: "hidden",
                border: `1px solid ${T.border}`,
              }}
            >
              {[
                {
                  n: "3",
                  label: "User roles",
                  sub: "Admin · Teacher · Student",
                },
                {
                  n: "1",
                  label: "Unified workspace",
                  sub: "No app switching, ever",
                },
                {
                  n: "0",
                  label: "Third-party trackers",
                  sub: "Your data stays yours",
                },
                { n: "∞", label: "Message threads", sub: "Organised by class" },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={
                    {
                      duration: 0.45,
                      delay: i * 0.08,
                      ease: EASE,
                    } as Transition
                  }
                  style={{ background: T.surface, padding: "36px 28px" }}
                >
                  <p
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 800,
                      fontSize: 52,
                      color: T.white, // #e8e8e8
                      lineHeight: 1,
                      marginBottom: 10,
                      letterSpacing: "-0.04em",
                    }}
                  >
                    {s.n}
                  </p>
                  <p
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 12,
                      color: T.body, // #aaa
                      marginBottom: 5,
                      letterSpacing: "0.02em",
                    }}
                  >
                    {s.label}
                  </p>
                  <p
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontSize: 13,
                      color: T.muted, // #888
                      lineHeight: 1.5,
                    }}
                  >
                    {s.sub}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ──────────────────────────────────────────────────────────────
            §4 CTA
        ─────────────────────────────────────────────────────────────── */}
        <section
          style={{ position: "relative", zIndex: 10, padding: "0 0 120px" }}
        >
          <div style={{ ...WRAP, ...PAD }}>
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, ease: EASE } as Transition}
              style={{
                border: `1px solid ${T.border}`,
                borderRadius: 14,
                padding: "clamp(36px,6vw,72px) clamp(24px,5vw,64px)",
                background: T.surface,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Decorative top line */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 1,
                  background: `linear-gradient(90deg, transparent, ${T.border2}, transparent)`,
                }}
              />
              {/* Corner glows */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: 280,
                  height: 280,
                  background:
                    "radial-gradient(circle at 100% 0%, #ffffff05 0%, transparent 55%)",
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  width: 200,
                  height: 200,
                  background:
                    "radial-gradient(circle at 0% 100%, #ffffff03 0%, transparent 55%)",
                  pointerEvents: "none",
                }}
              />

              <div
                className="cta-cols"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 60,
                }}
              >
                <div style={{ flex: 1, maxWidth: 480 }}>
                  <p
                    className="gsap-label"
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 11,
                      color: T.muted,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      marginBottom: 18,
                    }}
                  >
                    Early access
                  </p>
                  <h2
                    className="gsap-h"
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 800,
                      fontSize: "clamp(26px, 3.5vw, 50px)",
                      color: T.white,
                      lineHeight: 1.06,
                      letterSpacing: "-0.025em",
                      marginBottom: 16,
                    }}
                  >
                    Be first when
                    <br />
                    <span style={{ color: T.primary, fontWeight: 600 }}>
                      the signal goes live.
                    </span>
                  </h2>
                  <p
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontSize: 15,
                      color: T.body,
                      lineHeight: 1.75,
                      maxWidth: 380,
                    }}
                  >
                    Hermes Workspace is heading into private beta with Indian
                    schools — and expanding to all kinds of organisations soon.
                    Join the waitlist to get early access.
                  </p>
                </div>
                <div style={{ flex: 1, maxWidth: 440, paddingTop: 8 }}>
                  <WaitlistForm />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ──────────────────────────────────────────────────────────────
            FOOTER
        ─────────────────────────────────────────────────────────────── */}
        <footer
          style={{
            position: "relative",
            zIndex: 10,
            borderTop: `1px solid ${T.border}`,
            padding: "20px clamp(20px,5vw,72px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <IconBrandTelegram size={15} stroke={1.4} color={T.muted} />
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 12,
                color: T.muted,
              }}
            >
              Hermes Workspace © 2025
            </span>
          </div>
          <a
            href="mailto:contact@hermesworkspace.com"
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 12,
              color: T.muted,
              textDecoration: "none",
              transition: "color .2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = T.white)}
            onMouseLeave={(e) => (e.currentTarget.style.color = T.muted)}
          >
            contact@hermesworkspace.com
          </a>
        </footer>
      </div>
    </>
  );
}
