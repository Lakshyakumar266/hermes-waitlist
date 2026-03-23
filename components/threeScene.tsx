import { useEffect, useRef } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";

// ═══════════════════════════════════════════════════════════════════════════════
// THREE.JS SCENE

// ═══════════════════════════════════════════════════════════════════════════════
export interface SceneProps {
  size?: number;
  meshRef?: React.MutableRefObject<THREE.Object3D | null>;
  onReady?: () => void;
  onProgress?: (pct: number) => void;
}

export default function ThreeScene({
  size = 380,
  meshRef,
  onReady,
  onProgress,
}: SceneProps) {
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
        col += baseColor * envLight * 0.2;
        col += baseColor * vec3(1.0, 0.95, 0.85) * diffKey * 0.9;     // key diffuse
        col += baseColor * vec3(0.7, 0.82, 1.0)  * diffFill;          // fill diffuse
        col += vec3(1.0) * specKey * 0.45;                             // white specular
        col += vec3(0.45, 0.6, 1.0) * rim * 0.55;                     // blue rim
        col += vec3(1.0, 0.85, 0.7) * rim * rim * 0.15;               // warm rim
          // make gold more directional (strong where it hits)
        float goldMask = pow(diffGolden, 1.8);

        // stronger diffuse with contrast   
        col += baseColor * goldenColor * goldMask * goldenAtten * 5.0;

        // sharper, more visible specular (this brings back shine)
        col += goldenColor * pow(specGolden, 1.2) * goldenAtten * 3.5;

        // Softer vertical fade — shadow floor raised from 0.4 to 0.65
    float yFade = smoothstep(-2.5, 1.5, vWorldPos.y);

    // reduce effect strength (was too aggressive)
    col *= mix(0.85, 1.0, yFade);

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
        const sc = 1.8 / sph.radius;
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
    
  }, [size, meshRef, onReady, onProgress]);

  return (
    <div ref={mountRef} style={{ width: size, height: size, flexShrink: 0 }} />
  );
}
