/**
 * RotorVision demo — the same rotor sandwich product, in 3D and 4D.
 *
 *   - The centerpiece is a four-dimensional polytope (tesseract, 16-cell or
 *     5-cell) tumbling in a *double rotation*: two completely orthogonal planes
 *     (xy and zw) turning at once. That motion has no axis and no 3D analogue;
 *     a quaternion cannot express it, but the rotor's v′ = R v R~ extends to
 *     four dimensions unchanged. Edges are tinted by their w coordinate so the
 *     fourth dimension reads on screen.
 *   - Around it, solid 3D objects orbit a shared parent node and spin in their
 *     own bivector planes — ordinary 3D rotors, composing down the scene graph.
 *   - The camera rig is positioned with rotors too.
 *
 * The HUD reads the centerpiece's live 4D rotor: one scalar, the six bivector
 * planes, and the grade-4 pseudoscalar that 3D never needed.
 */
import {
  Engine,
  Scene,
  Camera,
  Object3D,
  Object4D,
  Geometry,
  Geometry4,
  Rotor,
  Rotor4,
  Bivector,
  Bivector4,
  Vec3,
} from "./index.js";

const canvas = document.getElementById("view");

const camera = new Camera({ fov: Math.PI / 3, near: 0.1, far: 120 });
const scene = new Scene({
  camera,
  background: { top: "#161d2e", bottom: "#070a12" },
  ambient: 0.26,
  lightDirection: new Vec3(-0.45, -1, -0.35),
  lightIntensity: 1.05,
});

// --- Ground grid --------------------------------------------------------
scene.add(
  new Object3D({
    name: "grid",
    mesh: Geometry.grid(48, 24, -4.2),
    // renderOrder: -1 forces the floor to paint before any solid object, so
    // its lines never bleed through holes in objects whose depth ranges
    // straddle the floor's depth.
    material: {
      color: { r: 58, g: 84, b: 120 },
      wireframe: true,
      renderOrder: -1,
    },
  }),
);

// --- Centerpiece: a 4D polytope, spun by a 4D rotor ---------------------
const VIEWER_W = 3.0; // distance of the 4D viewpoint along +w
const hyperDefs = [
  { name: "tesseract", geom: Geometry4.tesseract(1.0) },
  { name: "16-cell", geom: Geometry4.cell16(1.9) },
  { name: "5-cell", geom: Geometry4.cell5(1.5) },
];

const hyperObjects = hyperDefs.map((def, i) =>
  scene.add(
    new Object4D({
      name: def.name,
      vertices4: def.geom.vertices,
      edges: def.geom.edges,
      viewerW: VIEWER_W,
      scale: 1.7,
      position: new Vec3(0, 0.2, 0),
      visible: i === 0,
      colorNear: { r: 96, g: 165, b: 250 }, // edges deep in −w
      colorFar: { r: 250, g: 170, b: 90 }, // edges far out in +w
    }),
  ),
);
let activeShape = 0;

// The double rotation: two completely orthogonal planes at different rates.
const planeA = Bivector4.xy();
const planeB = Bivector4.zw();
const rateA = 0.55;
const rateB = 0.34;

// --- Orbiting 3D satellites ---------------------------------------------
const orbitNode = scene.add(new Object3D({ name: "orbit" }));
const RING = 8.2;

const satelliteDefs = [
  { name: "cube", mesh: Geometry.box(1.7, 1.7, 1.7), color: { r: 244, g: 146, b: 92 }, plane: new Bivector(0, 0, 1), rate: 1.4 },
  { name: "sphere", mesh: Geometry.sphere(1.1, 24, 16), color: { r: 150, g: 162, b: 244 }, plane: new Bivector(1, 0, 0), rate: 1.0 },
  { name: "octahedron", mesh: Geometry.octahedron(1.35), color: { r: 244, g: 206, b: 96 }, plane: new Bivector(0, 1, 0), rate: 1.7 },
  { name: "torus", mesh: Geometry.torus(1.0, 0.38, 28, 16), color: { r: 232, g: 116, b: 158 }, plane: new Bivector(1, 1, 0), rate: 1.2 },
  { name: "bar", mesh: Geometry.box(2.8, 0.6, 0.6), color: { r: 132, g: 222, b: 132 }, plane: new Bivector(0, 1, 1), rate: 2.1 },
];

const satellites = satelliteDefs.map((def, i) => {
  const angle = (i / satelliteDefs.length) * Math.PI * 2;
  const obj = new Object3D({
    name: def.name,
    mesh: def.mesh,
    material: { color: def.color },
    position: new Vec3(Math.cos(angle) * RING, 0, Math.sin(angle) * RING),
  });
  obj.spin = { plane: def.plane, rate: def.rate };
  orbitNode.add(obj);
  return obj;
});

// A moon: child of a satellite (three levels deep), all via rotor composition.
const moon = new Object3D({
  name: "moon",
  mesh: Geometry.octahedron(0.5),
  material: { color: { r: 226, g: 230, b: 240 } },
  position: new Vec3(2.3, 0, 0),
});
moon.spin = { plane: new Bivector(1, 0, 1), rate: 3.0 };
satellites[0].add(moon);

// --- Camera rig ---------------------------------------------------------
const camControl = {
  target: new Vec3(0, 0.4, 0),
  distance: 19,
  azimuth: 0.6,
  elevation: 0.42,
  autoOrbit: true,
};

// --- Engine -------------------------------------------------------------
const engine = new Engine(canvas, { scene, fog: true });

engine.onUpdate((dt) => {
  // Centerpiece: a 4D double rotation, kept in sync across all three shapes.
  const spin4 = Rotor4.doubleRotation(planeA, rateA * dt, planeB, rateB * dt);
  for (const obj of hyperObjects) obj.rotate4Local(spin4);

  // Orbit the 3D satellites by turning their shared parent node.
  orbitNode.rotateLocal(Rotor.fromAxisAngle(Vec3.e2(), 0.3 * dt));
  for (const sat of satellites) {
    sat.rotateLocal(Rotor.fromPlaneAngle(sat.spin.plane, sat.spin.rate * dt));
  }
  moon.rotateLocal(Rotor.fromPlaneAngle(moon.spin.plane, moon.spin.rate * dt));

  if (camControl.autoOrbit) camControl.azimuth += 0.12 * dt;
  camera.orbit(
    camControl.target,
    camControl.distance,
    camControl.azimuth,
    camControl.elevation,
  );

  updateHud();
});

// --- HUD ----------------------------------------------------------------
const hud = {
  fps: document.getElementById("hud-fps"),
  faces: document.getElementById("hud-faces"),
  shape: document.getElementById("hud-shape"),
  s: document.getElementById("hud-s"),
  b12: document.getElementById("hud-b12"),
  b13: document.getElementById("hud-b13"),
  b14: document.getElementById("hud-b14"),
  b23: document.getElementById("hud-b23"),
  b24: document.getElementById("hud-b24"),
  b34: document.getElementById("hud-b34"),
  b1234: document.getElementById("hud-b1234"),
};

const sign = (n) => (n >= 0 ? "+" : "−") + Math.abs(n).toFixed(4);

function updateHud() {
  const r = hyperObjects[activeShape].orientation4;
  hud.fps.textContent = engine.fps.toFixed(0);
  hud.faces.textContent = engine.renderer.stats.drawn;
  hud.s.textContent = sign(r.s);
  hud.b12.textContent = sign(r.b12);
  hud.b13.textContent = sign(r.b13);
  hud.b14.textContent = sign(r.b14);
  hud.b23.textContent = sign(r.b23);
  hud.b24.textContent = sign(r.b24);
  hud.b34.textContent = sign(r.b34);
  hud.b1234.textContent = sign(r.b1234);
}

// --- Collapsible HUD (collapsed by default on small screens) ------------
const hudPanel = document.getElementById("hud");
const hudToggle = document.getElementById("hud-toggle");
const compactScreen = window.matchMedia("(max-width: 720px)");
if (compactScreen.matches) hudPanel.classList.add("hud--collapsed");
hudToggle.addEventListener("click", () => {
  const collapsed = hudPanel.classList.toggle("hud--collapsed");
  hudToggle.setAttribute("aria-expanded", String(!collapsed));
});

// --- Controls -----------------------------------------------------------
const btnPause = document.getElementById("btn-pause");
const btnShape = document.getElementById("btn-shape");
const btnWire = document.getElementById("btn-wireframe");
const btnFog = document.getElementById("btn-fog");
const btnOrbit = document.getElementById("btn-orbit");

btnPause.addEventListener("click", () => {
  engine.toggle();
  btnPause.textContent = engine.running ? "Pause" : "Play";
  btnPause.classList.toggle("off", !engine.running);
});

btnShape.addEventListener("click", () => {
  hyperObjects[activeShape].visible = false;
  activeShape = (activeShape + 1) % hyperObjects.length;
  hyperObjects[activeShape].visible = true;
  hud.shape.textContent = hyperDefs[activeShape].name;
  if (!engine.running) engine.step(0);
});

btnWire.addEventListener("click", () => {
  engine.renderer.mode =
    engine.renderer.mode === "wireframe" ? "solid" : "wireframe";
  const on = engine.renderer.mode === "wireframe";
  btnWire.classList.toggle("active", on);
  if (!engine.running) engine.step(0);
});

btnFog.addEventListener("click", () => {
  engine.renderer.fog = !engine.renderer.fog;
  btnFog.classList.toggle("off", !engine.renderer.fog);
  if (!engine.running) engine.step(0);
});

btnOrbit.addEventListener("click", () => {
  camControl.autoOrbit = !camControl.autoOrbit;
  btnOrbit.classList.toggle("off", !camControl.autoOrbit);
});

// --- Pointer + wheel camera control -------------------------------------
let dragging = false;
let lastX = 0;
let lastY = 0;

canvas.addEventListener("pointerdown", (e) => {
  dragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
  camControl.autoOrbit = false;
  btnOrbit.classList.add("off");
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  camControl.azimuth -= (e.clientX - lastX) * 0.01;
  camControl.elevation -= (e.clientY - lastY) * 0.01;
  camControl.elevation = Math.max(-1.4, Math.min(1.4, camControl.elevation));
  lastX = e.clientX;
  lastY = e.clientY;
  if (!engine.running) engine.step(0);
});

canvas.addEventListener("pointerup", () => {
  dragging = false;
});

canvas.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    camControl.distance *= e.deltaY > 0 ? 1.1 : 0.9;
    camControl.distance = Math.max(7, Math.min(48, camControl.distance));
    if (!engine.running) engine.step(0);
  },
  { passive: false },
);

engine.start();
