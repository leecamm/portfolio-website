// Mission control launch sequence: a low-poly rocket rides a glowing pipeline track, then lifts off.
// Plain three.js, loaded lazily. It owns no scroll logic: the caller feeds progress (0..1).
import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  Line,
  LineDashedMaterial,
  LineSegments,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PointLight,
  Points,
  Quaternion,
  RingGeometry,
  Scene,
  ShaderMaterial,
  Shape,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  TorusGeometry,
  TubeGeometry,
  Vector3,
  WebGLRenderer,
} from "three";
import { missionTiming } from "../data/content";

export const STAGE_AT = missionTiming.stageAt;
export const LIFTOFF_AT = missionTiming.liftoffAt;
const GONE_AT = 0.95; // liftoff is over, the stars settle

const FOV = 35;
const TAN_HALF = Math.tan(MathUtils.degToRad(FOV / 2));
const PARALLAX = MathUtils.degToRad(3);
const Z_AXIS = new Vector3(0, 0, 1);
const Y_AXIS = new Vector3(0, 1, 0);

const PALETTE = {
  bg: 0x05040d,
  indigo: 0x6366f1,
  violet: 0xa855f7,
  starIndigo: 0xa5b4fc,
  starViolet: 0xe9d5ff,
  ember: 0xff5023,
  flare: 0xff9811,
};

export function supportsWebGL() {
  try {
    if (typeof window === "undefined" || !window.WebGLRenderingContext) return false;
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return !!gl;
  } catch {
    return false;
  }
}

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth = (a, b, x) => MathUtils.smoothstep(x, a, b);
const easeOutCubic = (t) => 1 - (1 - t) ** 3;
const easeInOut = (t) => t * t * (3 - 2 * t);
const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));

// A soft white disc, shared by every glow sprite.
function makeGlowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.2, "rgba(255,255,255,0.55)");
  grad.addColorStop(0.5, "rgba(255,255,255,0.14)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

const STAR_VERT = /* glsl */ `
  attribute vec3 aSeed; // size, twinkle speed, phase
  attribute float aEnd; // streaks only: 0 head, 1 tail
  uniform float uTime, uTravel, uWarp, uPixelRatio, uFarZ, uDepth, uNearZ, uStreak;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float z = uFarZ + mod(position.z - uFarZ + uTravel, uDepth);
    z -= aEnd * uWarp * (4.0 + 5.5 * aSeed.x);
    vec4 mv = modelViewMatrix * vec4(position.xy, z, 1.0);
    gl_Position = projectionMatrix * mv;
    float dist = max(-mv.z, 0.5);
    float twinkle = 0.7 + 0.3 * sin(uTime * aSeed.y + aSeed.z);
    float fade = smoothstep(uFarZ, uFarZ + 18.0, z) * (1.0 - smoothstep(uNearZ - 6.0, uNearZ, z));
    vAlpha = fade * mix(twinkle, 1.0, uStreak) * (1.0 + 0.5 * uWarp) * mix(1.0, 0.8 * uWarp * (1.0 - aEnd), uStreak);
    vColor = color;
    gl_PointSize = clamp(aSeed.x * 55.0 / dist, 1.0, 6.0) * uPixelRatio * (1.0 + 0.5 * uWarp);
  }
`;
const STAR_FRAG = /* glsl */ `
  uniform float uStreak;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float a = vAlpha;
    if (uStreak < 0.5) {
      float d = length(gl_PointCoord - 0.5);
      a *= smoothstep(0.5, 0.05, d);
    }
    gl_FragColor = vec4(vColor, a);
    #include <colorspace_fragment>
  }
`;

// Soft tube: bright where it faces the camera, fading to nothing at the silhouette.
const GLOW_VERT = /* glsl */ `
  varying vec3 vColor;
  varying float vFacing;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vFacing = abs(dot(normalize(normalMatrix * normal), normalize(-mv.xyz)));
    vColor = color;
    gl_Position = projectionMatrix * mv;
  }
`;
const GLOW_FRAG = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vFacing;
  void main() {
    gl_FragColor = vec4(vColor, pow(vFacing, 2.5) * uOpacity);
    #include <colorspace_fragment>
  }
`;

const FLAME_VERT = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying float vFacing;
  void main() {
    vUv = uv;
    vec3 p = position;
    float wob = sin(uTime * 41.0 + p.y * 16.0) * 0.09 + sin(uTime * 23.0 + p.y * 9.0) * 0.07;
    p.xz *= 1.0 + wob * uv.y;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vFacing = abs(dot(normalize(normalMatrix * normal), normalize(-mv.xyz)));
    gl_Position = projectionMatrix * mv;
  }
`;
const FLAME_FRAG = /* glsl */ `
  uniform vec3 uHot, uEmber;
  uniform float uOpacity;
  varying vec2 vUv;
  varying float vFacing;
  void main() {
    float t = vUv.y; // 0 at the nozzle, 1 at the tip
    vec3 c = mix(uHot, uEmber, smoothstep(0.0, 0.75, t));
    gl_FragColor = vec4(c, pow(1.0 - t, 1.3) * pow(vFacing, 1.6) * uOpacity);
    #include <colorspace_fragment>
  }
`;

const RING_VERT = /* glsl */ `
  varying float vR;
  void main() {
    vR = length(position.xy);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const RING_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vR;
  void main() {
    float t = (vR - 0.84) / 0.16;
    float a = t * t * (1.0 - smoothstep(0.75, 1.0, t));
    gl_FragColor = vec4(uColor, a * uOpacity);
    #include <colorspace_fragment>
  }
`;

// Where the track runs, in canvas pixels. Desktop mirrors the card grid (max-w-6xl, px-12, gap-4)
// so each node sits under its card; mobile runs down the cards' right padding.
function layoutPoints(w, h, mobile) {
  if (mobile) {
    const x = w - 44;
    return [
      [w - 16, -50, 0], // enters from above, along the margin past the copy
      [x - 5, h * 0.31, 0.2],
      [x + 5, h * 0.435, -0.2],
      [x - 5, h * 0.56, 0.2],
      [x + 3, h * 0.685, 0],
      [x - 22, h * 0.86, 0.1],
    ];
  }
  const contentW = Math.min(w, 1152) - 96;
  const left = (w - contentW) / 2;
  const col = (contentW - 48) / 4;
  const y = h * 0.8;
  const cx = (i) => left + col * (i + 0.5) + 16 * i;
  return [
    [Math.max(40, left - 120), y + 26, -0.4],
    [cx(0), y + 6, 0],
    [cx(1), y - 10, 0.35],
    [cx(2), y + 8, -0.25],
    [cx(3), y - 6, 0.2],
    [Math.min(w - 90, cx(3) + 195), y - 64, 0],
  ];
}

export function createMissionScene(canvas, { mobile = false } = {}) {
  const ppu = mobile ? 64 : 100; // pixels per world unit on the track plane (z = 0)
  const disposables = new Set();
  const own = (x) => (disposables.add(x), x);

  const renderer = new WebGLRenderer({ canvas, antialias: !mobile, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.setClearColor(PALETTE.bg, 1);

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 400);
  const glowTex = own(makeGlowTexture());

  // ---------- lights
  scene.add(new AmbientLight(0x8b8cf0, 0.35));
  const key = new DirectionalLight(0xffffff, 2.4);
  key.position.set(-3, 5, 7);
  scene.add(key);
  const rig = new Group(); // rim lights travel with the rocket
  const rimA = new PointLight(PALETTE.indigo, 9, 0, 2);
  rimA.position.set(-1.1, 0.7, -0.9);
  const rimB = new PointLight(PALETTE.violet, 8, 0, 2);
  rimB.position.set(1.1, -0.5, -0.8);
  rig.add(rimA, rimB);
  scene.add(rig);

  // ---------- nebula: soft colour in the deep background (replaces the CSS glow)
  const nebulaA = new Sprite(own(new SpriteMaterial({ map: glowTex, color: 0x4338ca, opacity: 0.55, blending: AdditiveBlending, depthWrite: false, toneMapped: false })));
  const nebulaB = new Sprite(own(new SpriteMaterial({ map: glowTex, color: 0x7e22ce, opacity: 0.28, blending: AdditiveBlending, depthWrite: false, toneMapped: false })));
  scene.add(nebulaA, nebulaB);

  // ---------- stars (+ warp streaks sharing the same field)
  const starCount = mobile ? 700 : 2500;
  const starUniforms = {
    uTime: { value: 0 },
    uTravel: { value: 0 },
    uWarp: { value: 0 },
    uPixelRatio: { value: renderer.getPixelRatio() },
    uFarZ: { value: -120 },
    uDepth: { value: 130 },
    uNearZ: { value: 10 },
    uStreak: { value: 0 },
  };
  const starPos = new Float32Array(starCount * 3);
  const starCol = new Float32Array(starCount * 3);
  const starSeed = new Float32Array(starCount * 3);
  {
    const tints = [new Color(0xffffff), new Color(PALETTE.starIndigo), new Color(PALETTE.starViolet)];
    // spread to cover the far end of the frustum for this aspect, with room for parallax
    const spreadY = 150 * TAN_HALF * 1.15;
    const spreadX = spreadY * (mobile ? 0.55 : 1.95);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() * 2 - 1) * spreadX;
      starPos[i * 3 + 1] = (Math.random() * 2 - 1) * spreadY;
      starPos[i * 3 + 2] = -120 + Math.random() * 130;
      const tint = tints[Math.random() < 0.55 ? 0 : Math.random() < 0.55 ? 1 : 2];
      tint.toArray(starCol, i * 3);
      starSeed[i * 3] = Math.random() < 0.05 ? 4 + Math.random() * 2 : 1.1 + Math.random() * 2.2;
      starSeed[i * 3 + 1] = 0.6 + Math.random() * 2.4;
      starSeed[i * 3 + 2] = Math.random() * Math.PI * 2;
    }
  }
  const starGeo = own(new BufferGeometry());
  starGeo.setAttribute("position", new BufferAttribute(starPos, 3));
  starGeo.setAttribute("color", new BufferAttribute(starCol, 3));
  starGeo.setAttribute("aSeed", new BufferAttribute(starSeed, 3));
  starGeo.setAttribute("aEnd", new BufferAttribute(new Float32Array(starCount), 1));
  const starMat = own(
    new ShaderMaterial({ uniforms: starUniforms, vertexShader: STAR_VERT, fragmentShader: STAR_FRAG, vertexColors: true, transparent: true, depthWrite: false, blending: AdditiveBlending })
  );
  const stars = new Points(starGeo, starMat);
  stars.frustumCulled = false;
  scene.add(stars);

  const streakGeo = own(new BufferGeometry());
  {
    // every third star also streaks during warp: dense enough to read as speed, light enough to read text through
    const n = Math.ceil(starCount / 3);
    const pairs = (src, size) => {
      const out = new Float32Array(n * size * 2);
      for (let j = 0; j < n; j++) {
        for (let k = 0; k < size; k++) out[j * size * 2 + k] = out[j * size * 2 + size + k] = src[j * 3 * size + k];
      }
      return out;
    };
    const ends = new Float32Array(n * 2);
    for (let j = 0; j < n; j++) ends[j * 2 + 1] = 1;
    streakGeo.setAttribute("position", new BufferAttribute(pairs(starPos, 3), 3));
    streakGeo.setAttribute("color", new BufferAttribute(pairs(starCol, 3), 3));
    streakGeo.setAttribute("aSeed", new BufferAttribute(pairs(starSeed, 3), 3));
    streakGeo.setAttribute("aEnd", new BufferAttribute(ends, 1));
  }
  const streakMat = own(
    new ShaderMaterial({
      uniforms: { ...starUniforms, uStreak: { value: 1 } },
      vertexShader: STAR_VERT,
      fragmentShader: STAR_FRAG,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    })
  );
  const streaks = new LineSegments(streakGeo, streakMat);
  streaks.frustumCulled = false;
  streaks.visible = false;
  scene.add(streaks);

  // ---------- track (geometry rebuilt on resize)
  const coreMat = own(new MeshBasicMaterial({ vertexColors: true, toneMapped: false }));
  const glowMat = own(
    new ShaderMaterial({
      uniforms: { uOpacity: { value: 0.55 } },
      vertexShader: GLOW_VERT,
      fragmentShader: GLOW_FRAG,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    })
  );
  const routeMat = own(new LineDashedMaterial({ color: 0x818cf8, dashSize: 0.09, gapSize: 0.08, transparent: true, opacity: 0.35, toneMapped: false }));
  const trackCore = new Mesh(new BufferGeometry(), coreMat);
  const trackGlow = new Mesh(new BufferGeometry(), glowMat);
  const route = new Line(new BufferGeometry(), routeMat);
  scene.add(route, trackGlow, trackCore);

  const nodeCoreGeo = own(new SphereGeometry(0.055, 16, 12));
  const nodeRingGeo = own(new TorusGeometry(0.13, 0.012, 8, 40));
  const nodes = STAGE_AT.map(() => {
    const group = new Group();
    const core = new Mesh(nodeCoreGeo, own(new MeshBasicMaterial({ color: 0x3b3a6b, toneMapped: false })));
    const ringMat = () => own(new MeshBasicMaterial({ color: 0xc4b5fd, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, toneMapped: false }));
    const ring = new Mesh(nodeRingGeo, ringMat());
    const pulse = new Mesh(nodeRingGeo, ringMat());
    const halo = new Sprite(own(new SpriteMaterial({ map: glowTex, color: 0x8b5cf6, transparent: true, opacity: 0.2, blending: AdditiveBlending, depthWrite: false, toneMapped: false })));
    group.add(halo, pulse, ring, core);
    scene.add(group);
    return { group, core, ring, pulse, halo };
  });
  const nodeDim = new Color(0x3b3a6b);
  const nodeLit = new Color(0xf5f3ff);

  // ---------- rocket (built nose-up along +Y, origin at mid-body)
  const rocket = new Group();
  const hull = new Group();
  hull.position.y = -0.42;
  rocket.add(hull);
  const bodyMat = own(new MeshStandardMaterial({ color: 0x5154e8, roughness: 0.38, metalness: 0.25 }));
  const trimMat = own(new MeshStandardMaterial({ color: 0xf5f3ff, roughness: 0.35, metalness: 0.1 }));
  const finMat = own(new MeshStandardMaterial({ color: 0xa855f7, roughness: 0.42, metalness: 0.2 }));
  const darkMat = own(new MeshStandardMaterial({ color: 0x272452, roughness: 0.45, metalness: 0.6 }));
  const glassMat = own(new MeshStandardMaterial({ color: 0x1e1b4b, emissive: 0x818cf8, emissiveIntensity: 0.9, roughness: 0.15, metalness: 0.3 }));
  const addPart = (geo, mat, y = 0) => {
    const m = new Mesh(own(geo), mat);
    m.position.y = y;
    hull.add(m);
    return m;
  };
  addPart(new CylinderGeometry(0.17, 0.19, 0.62, 28), bodyMat, 0.31);
  addPart(new ConeGeometry(0.17, 0.42, 28), finMat, 0.62 + 0.21);
  addPart(new CylinderGeometry(0.178, 0.178, 0.045, 28), trimMat, 0.62);
  addPart(new CylinderGeometry(0.195, 0.195, 0.04, 28), trimMat, 0.05);
  addPart(new CylinderGeometry(0.1, 0.135, 0.11, 20, 1, true), darkMat, -0.05);
  const windowFrame = addPart(new TorusGeometry(0.068, 0.018, 10, 28), trimMat, 0.4);
  windowFrame.position.z = 0.178;
  const glass = addPart(new CircleGeometry(0.066, 24), glassMat, 0.4);
  glass.position.z = 0.176;
  {
    const fin = new Shape();
    fin.moveTo(0, 0.3);
    fin.lineTo(0.17, 0.05);
    fin.lineTo(0.19, -0.13);
    fin.lineTo(0, -0.02);
    fin.closePath();
    const finGeo = own(new ExtrudeGeometry(fin, { depth: 0.036, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 1 }));
    finGeo.translate(0, 0, -0.018);
    for (let i = 0; i < 4; i++) {
      const pivot = new Group();
      pivot.rotation.y = Math.PI / 4 + (i * Math.PI) / 2;
      const m = new Mesh(finGeo, finMat);
      m.position.set(0.17, 0.02, 0);
      pivot.add(m);
      hull.add(pivot);
    }
  }
  // flame: two soft additive cones plus a glow sprite, all hanging below the nozzle
  const flameGeo = own(new ConeGeometry(0.11, 0.62, 20, 6, true));
  flameGeo.rotateX(Math.PI);
  flameGeo.translate(0, -0.31, 0);
  const flameUniforms = (hot, ember, opacity) => ({
    uTime: { value: 0 },
    uHot: { value: new Color(hot) },
    uEmber: { value: new Color(ember) },
    uOpacity: { value: opacity },
  });
  const flameShader = (uniforms) =>
    own(new ShaderMaterial({ uniforms, vertexShader: FLAME_VERT, fragmentShader: FLAME_FRAG, transparent: true, depthWrite: false, blending: AdditiveBlending, toneMapped: false }));
  const flameOuterMat = flameShader(flameUniforms(PALETTE.flare, PALETTE.ember, 1));
  const flameInnerMat = flameShader(flameUniforms(0xfff1d6, PALETTE.flare, 1));
  const flame = new Group();
  flame.position.y = -0.11;
  const flameOuter = new Mesh(flameGeo, flameOuterMat);
  const flameInner = new Mesh(flameGeo, flameInnerMat);
  flameInner.scale.set(0.55, 0.6, 0.55);
  flame.add(flameOuter, flameInner);
  hull.add(flame);
  const engineGlow = new Sprite(own(new SpriteMaterial({ map: glowTex, color: PALETTE.ember, transparent: true, opacity: 0.8, blending: AdditiveBlending, depthWrite: false, toneMapped: false })));
  engineGlow.position.y = -0.22;
  hull.add(engineGlow);
  const flameLight = new PointLight(PALETTE.flare, 2, 0, 2);
  flameLight.position.set(0, -0.35, 0.25);
  hull.add(flameLight);
  scene.add(rocket);

  // ---------- liftoff effects at the pad
  const ringGeo = own(new RingGeometry(0.84, 1, 128, 1));
  const makeRing = (color) => {
    const m = new Mesh(
      ringGeo,
      own(
        new ShaderMaterial({
          uniforms: { uColor: { value: new Color(color) }, uOpacity: { value: 0 } },
          vertexShader: RING_VERT,
          fragmentShader: RING_FRAG,
          transparent: true,
          depthWrite: false,
          blending: AdditiveBlending,
          side: DoubleSide,
          toneMapped: false,
        })
      )
    );
    m.rotation.x = -Math.PI / 2 + 0.42; // lying on the pad, tilted toward the camera
    m.visible = false;
    scene.add(m);
    return m;
  };
  const shock = makeRing(0xe9d5ff);
  const shock2 = makeRing(PALETTE.flare);
  const padFlash = new Sprite(own(new SpriteMaterial({ map: glowTex, color: PALETTE.flare, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, toneMapped: false })));
  scene.add(padFlash);

  // ---------- layout-dependent state
  let curve = null;
  let knotsU = [0, 0, 0, 0, 0, 1];
  const knotsP = [0, ...STAGE_AT, LIFTOFF_AT];
  const pad = new Vector3();
  let padAngle = 0;
  let camDist = 14;
  let riseDist = 10;
  let indexPerSegment = 0;
  const TUBE_SEGMENTS = 260;
  const ROUTE_POINTS = 300;

  const colorize = (geo) => {
    const uv = geo.attributes.uv;
    const colors = new Float32Array(uv.count * 3);
    const a = new Color(PALETTE.indigo);
    const b = new Color(PALETTE.violet);
    const c = new Color();
    for (let i = 0; i < uv.count; i++) c.copy(a).lerp(b, uv.getX(i)).toArray(colors, i * 3);
    geo.setAttribute("color", new BufferAttribute(colors, 3));
    return geo;
  };

  let width = 0;
  let height = 0;
  function layout(w, h) {
    const pts = layoutPoints(w, h, mobile).map(([x, y, z]) => new Vector3((x - w / 2) / ppu, (h / 2 - y) / ppu, z));
    curve = new CatmullRomCurve3(pts, false, "centripetal");
    const lengths = curve.getLengths(250); // 6 points: control point i sits at t = i / 5, i.e. index 50 i
    knotsU = pts.map((_, i) => lengths[i * 50] / lengths[250]);

    trackCore.geometry.dispose();
    trackGlow.geometry.dispose();
    route.geometry.dispose();
    trackCore.geometry = colorize(new TubeGeometry(curve, TUBE_SEGMENTS, mobile ? 0.032 : 0.02, 8, false));
    trackGlow.geometry = colorize(new TubeGeometry(curve, TUBE_SEGMENTS, mobile ? 0.15 : 0.11, 12, false));
    route.geometry = new BufferGeometry().setFromPoints(curve.getSpacedPoints(ROUTE_POINTS));
    route.computeLineDistances();
    indexPerSegment = 8 * 6;

    nodes.forEach((n, i) => n.group.position.copy(pts[i + 1]));
    pad.copy(pts[5]);
    const tan = curve.getTangentAt(1);
    padAngle = wrapAngle(Math.atan2(tan.y, tan.x) - Math.PI / 2);
    padFlash.position.copy(pad);
    shock.position.copy(pad);
    shock2.position.copy(pad);

    camDist = h / 2 / ppu / TAN_HALF;
    riseDist = h / ppu + 2.5;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    starUniforms.uNearZ.value = camDist - 1;
    starUniforms.uDepth.value = camDist - 1 + 120;

    // nebula sprites sit deep behind the track; k scales track-plane sizes out to their depth
    const halfW = w / 2 / ppu;
    const halfH = h / 2 / ppu;
    const kA = (camDist + 30) / camDist;
    const kB = (camDist + 40) / camDist;
    nebulaA.position.set(0, -halfH * 1.05 * kA, -30);
    nebulaA.scale.set(halfW * 2.6 * kA, halfH * 1.6 * kA, 1);
    const rB = Math.min(halfW, halfH) * 1.6 * kB;
    nebulaB.position.set(halfW * 0.7 * kB, halfH * 0.75 * kB, -40);
    nebulaB.scale.set(rB, rB, 1);
  }

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h || (w === width && h === height)) return;
    width = w;
    height = h;
    renderer.setSize(w, h, false);
    layout(w, h);
  }

  // ---------- per-frame state (no allocations in the loop)
  const pos = new Vector3();
  const tan = new Vector3();
  const ahead = new Vector3();
  const qa = new Quaternion();
  const qb = new Quaternion();
  const lookAt = new Vector3();
  let target = 0;
  let current = 0;
  let activity = 0;
  let flicker = 0.5;
  let time = 0;
  let travel = 0;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

  function progressToU(p) {
    for (let i = 1; i < knotsP.length; i++) {
      if (p <= knotsP[i]) return MathUtils.lerp(knotsU[i - 1], knotsU[i], (p - knotsP[i - 1]) / (knotsP[i] - knotsP[i - 1]));
    }
    return 1;
  }

  function update(dt) {
    const p = current;
    const l = clamp01((p - LIFTOFF_AT) / (GONE_AT - LIFTOFF_AT));
    const launched = p > LIFTOFF_AT;

    // rocket on the track, then up and away
    const u = launched ? 1 : progressToU(p);
    let angle;
    let boost = 0;
    if (!launched) {
      curve.getPointAt(u, pos);
      // central difference: Curve.getTangentAt allocates two vectors per call
      curve.getPointAt(Math.min(1, u + 0.002), ahead);
      curve.getPointAt(Math.max(0, u - 0.002), tan);
      tan.subVectors(ahead, tan);
      angle = Math.atan2(tan.y, tan.x) - Math.PI / 2;
    } else {
      const pitch = easeInOut(clamp01(l / 0.2));
      angle = padAngle * (1 - pitch);
      const rise = riseDist * clamp01((l - 0.05) / 0.6) ** 2.2;
      pos.copy(pad);
      pos.y += rise;
      pos.x += Math.sin(l * 3) * 0.15;
      boost = smooth(0, 0.12, l);
      const rumble = 0.012 * boost * (1 - l);
      pos.x += (Math.random() - 0.5) * rumble;
      pos.y += (Math.random() - 0.5) * rumble;
    }
    rocket.visible = p < GONE_AT && pos.y < pad.y + riseDist - 0.2;
    rocket.position.copy(pos);
    qa.setFromAxisAngle(Z_AXIS, angle);
    qb.setFromAxisAngle(Y_AXIS, Math.sin(time * 0.9) * 0.35 + l * 4);
    rocket.quaternion.copy(qa).multiply(qb);
    rig.position.copy(pos);

    flicker += (Math.random() - flicker) * 0.35;
    const thrust = launched ? 1 + 1.6 * boost : 0.55 + 0.45 * activity;
    flame.scale.set(1 + 0.3 * boost, thrust * (0.85 + 0.3 * flicker), 1 + 0.3 * boost);
    flameOuterMat.uniforms.uTime.value = time;
    flameInnerMat.uniforms.uTime.value = time + 1.7;
    engineGlow.scale.setScalar(0.7 + 0.5 * thrust + 0.15 * flicker);
    engineGlow.material.opacity = 0.55 + 0.25 * flicker;
    flameLight.intensity = (1.2 + 1.3 * flicker) * thrust;

    // track reveal follows the rocket
    const segs = Math.floor(u * TUBE_SEGMENTS);
    trackCore.geometry.setDrawRange(0, segs * indexPerSegment);
    trackGlow.geometry.setDrawRange(0, segs * 12 * 6);
    route.geometry.setDrawRange(Math.floor(u * ROUTE_POINTS), Infinity); // dashed plan only ahead of the rocket
    glowMat.uniforms.uOpacity.value = 0.5 + 0.12 * Math.sin(time * 1.6) * smooth(GONE_AT, 1, p);

    // nodes brighten as they are passed, with a short flare on arrival
    for (let i = 0; i < nodes.length; i++) {
      const s = STAGE_AT[i];
      const passed = smooth(s - 0.012, s, p);
      const approach = smooth(s - 0.08, s, p) * (1 - passed);
      const flare = p > s ? Math.exp(-(p - s) * 30) : 0;
      const n = nodes[i];
      n.core.material.color.copy(nodeDim).lerp(nodeLit, passed);
      n.core.scale.setScalar(1 + 0.5 * flare + 0.2 * passed);
      n.halo.scale.setScalar(0.4 + 0.35 * passed + 0.25 * approach + 1.1 * flare);
      n.halo.material.opacity = 0.15 + 0.5 * passed + 0.2 * approach + 0.35 * flare;
      n.ring.material.opacity = 0.12 + 0.3 * approach + 0.45 * passed * (0.8 + 0.2 * Math.sin(time * 2 + i));
      n.pulse.visible = flare > 0.01;
      n.pulse.scale.setScalar(1 + 2.6 * (1 - flare));
      n.pulse.material.opacity = 0.9 * flare;
      n.ring.lookAt(camera.position);
      n.pulse.quaternion.copy(n.ring.quaternion);
    }

    // shockwave rings and pad flash
    const s1 = clamp01((l - 0.05) / 0.45);
    const s2 = clamp01((l - 0.12) / 0.55);
    shock.visible = launched && s1 > 0 && s1 < 1;
    shock.scale.setScalar(0.25 + 4.6 * easeOutCubic(s1));
    shock.material.uniforms.uOpacity.value = 0.9 * (1 - s1) ** 1.4;
    shock2.visible = launched && s2 > 0 && s2 < 1;
    shock2.scale.setScalar(0.2 + 3.8 * easeOutCubic(s2));
    shock2.material.uniforms.uOpacity.value = 0.8 * (1 - s2) ** 2;
    const flash = launched ? smooth(0, 0.07, l) * (1 - smooth(0.1, 0.45, l)) : 0;
    padFlash.visible = flash > 0.001;
    padFlash.material.opacity = flash;
    padFlash.scale.setScalar(1 + 4 * flash);

    // stars: calm drift, warp during liftoff, settle after
    const warp = smooth(0.84, 0.88, p) * (1 - smooth(0.91, 0.965, p));
    travel += dt * (0.5 + warp * 85);
    starUniforms.uTime.value = time;
    starUniforms.uTravel.value = travel;
    starUniforms.uWarp.value = warp;
    streaks.visible = warp > 0.01;

    // camera: pointer parallax, a slight lift while following the launch, decaying shake
    pointer.x += (pointer.tx - pointer.x) * (1 - Math.exp(-dt * 3));
    pointer.y += (pointer.ty - pointer.y) * (1 - Math.exp(-dt * 3));
    const yaw = pointer.x * 2 * PARALLAX;
    const pitchAng = -pointer.y * 2 * PARALLAX;
    const lift = 0.5 * smooth(LIFTOFF_AT, 0.86, p) * (1 - smooth(0.9, 1, p));
    const shakeEnv = smooth(LIFTOFF_AT, LIFTOFF_AT + 0.02, p) * (1 - smooth(LIFTOFF_AT + 0.03, 0.92, p));
    const shake = 0.07 * shakeEnv * (0.35 + 0.65 * activity);
    const sx = shake * (Math.sin(time * 47.3) * 0.6 + Math.sin(time * 83.1) * 0.4);
    const sy = shake * (Math.sin(time * 53.7 + 1) * 0.6 + Math.sin(time * 71.9) * 0.4);
    lookAt.set(sx, lift + sy, 0);
    camera.position.set(
      lookAt.x + camDist * Math.sin(yaw) * Math.cos(pitchAng),
      lookAt.y + camDist * Math.sin(pitchAng),
      camDist * Math.cos(yaw) * Math.cos(pitchAng)
    );
    camera.lookAt(lookAt);
    camera.rotateZ(shake * 0.25 * Math.sin(time * 61));
    const fov = FOV + 3 * warp;
    if (camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  }

  // ---------- loop
  let raf = 0;
  let running = false; // the caller wants frames
  let last = 0;
  let disposed = false;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
    last = now;
    time += dt;
    const prev = current;
    current += (target - current) * (1 - Math.exp(-dt * 7));
    if (Math.abs(target - current) < 1e-5) current = target;
    const vel = Math.abs(current - prev) / dt;
    activity += (Math.min(vel * 6, 1) - activity) * (1 - Math.exp(-dt * 4));
    update(dt);
    renderer.render(scene, camera);
  }
  const loop = (on) => {
    if (on && !raf && !document.hidden) {
      last = 0;
      raf = requestAnimationFrame(frame);
    } else if (!on && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };
  const onVisibility = () => loop(running && !document.hidden);
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("resize", resize);
  resize();

  if (import.meta.env.DEV) window.__missionSceneInfo = renderer.info;

  return {
    setProgress(p) {
      target = clamp01(p);
    },
    setPointer(x, y) {
      pointer.tx = MathUtils.clamp(x, -0.5, 0.5);
      pointer.ty = MathUtils.clamp(y, -0.5, 0.5);
    },
    start() {
      if (disposed) return;
      running = true;
      loop(true);
    },
    stop() {
      running = false;
      loop(false);
    },
    resize,
    dispose() {
      if (disposed) return;
      disposed = true;
      running = false;
      loop(false);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", resize);
      trackCore.geometry.dispose();
      trackGlow.geometry.dispose();
      route.geometry.dispose();
      for (const d of disposables) d.dispose();
      disposables.clear();
      renderer.dispose();
      renderer.forceContextLoss();
      if (import.meta.env.DEV) delete window.__missionSceneInfo;
    },
  };
}
