import { Vec3 } from "../math/vec3.js";
import { Rotor4 } from "../ga/rotor4.js";
import { Object3D } from "./object3d.js";
import { Mesh } from "./mesh.js";

/**
 * Object4D — a four-dimensional wireframe living inside the 3D scene graph.
 *
 * It carries 4D geometry (Vec4 vertices + edges) and a 4D orientation rotor.
 * Each frame it spins the vertices with the *same* sandwich product used in
 * 3D, projects them down to 3D with a perspective divide along w, and writes
 * the result into an ordinary Mesh of line segments. From there the normal
 * pipeline takes over — so the object can also be positioned and oriented in
 * the 3D world by the usual (3D) scene-graph rotor. Two layers of rotors: one
 * four-dimensional spin, one three-dimensional placement.
 *
 * Edges are tinted by their w coordinate so the otherwise-invisible fourth
 * dimension reads on screen: segments deep in −w and +w take distinct colours.
 */
export class Object4D extends Object3D {
  constructor(options = {}) {
    const vertices4 = options.vertices4 ?? [];
    const edges = options.edges ?? [];
    super({
      ...options,
      mesh: new Mesh(
        vertices4.map(() => new Vec3()),
        [],
        edges,
      ),
    });

    this.vertices4 = vertices4;
    this.edges = edges;
    this.orientation4 = options.orientation4 ?? Rotor4.identity();

    // Distance of the 4D viewpoint along +w for the 4D→3D perspective divide.
    this.viewerW = options.viewerW ?? 3.2;
    // Endpoint colours of the w gradient (−w … +w).
    this.colorNear = options.colorNear ?? { r: 96, g: 165, b: 250 };
    this.colorFar = options.colorFar ?? { r: 250, g: 170, b: 90 };

    // The 4D circumradius — a fixed reference for stable edge colouring.
    this.radius4 = Math.max(1e-6, ...vertices4.map((v) => v.length()));

    this.mesh.lineColors = edges.map(() => ({ r: 200, g: 200, b: 200 }));
    this.project();
  }

  /** Post-compose a 4D rotor — spin the object within four-space. */
  rotate4Local(rotor4) {
    this.orientation4 = this.orientation4.mul(rotor4).normalize();
    return this;
  }

  /**
   * Apply the 4D rotor, then project to 3D. The projection is a perspective
   * divide along w: vertices nearer the 4D viewpoint (larger w) fan outward,
   * those further in (smaller w) shrink inward — the effect that makes a
   * tesseract look like a cube nested inside a cube.
   */
  project() {
    const rotated = this.vertices4.map((v) => this.orientation4.rotate(v));
    for (let i = 0; i < rotated.length; i++) {
      const r = rotated[i];
      let denom = this.viewerW - r.w;
      if (Math.abs(denom) < 1e-4) denom = 1e-4;
      const f = this.viewerW / denom;
      this.mesh.vertices[i] = new Vec3(r.x * f, r.y * f, r.z * f);
    }
    for (let e = 0; e < this.edges.length; e++) {
      const [a, b] = this.edges[e];
      const wAvg = (rotated[a].w + rotated[b].w) / 2;
      const t = (wAvg / this.radius4 + 1) / 2;
      this.mesh.lineColors[e] = lerpColor(this.colorNear, this.colorFar, t);
    }
  }

  /** Reproject before the scene graph folds the world transform down. */
  updateWorld(parentPosition, parentOrientation, parentScale) {
    this.project();
    super.updateWorld(parentPosition, parentOrientation, parentScale);
  }
}

function lerpColor(a, b, t) {
  const k = t < 0 ? 0 : t > 1 ? 1 : t;
  return {
    r: a.r + (b.r - a.r) * k,
    g: a.g + (b.g - a.g) * k,
    b: a.b + (b.b - a.b) * k,
  };
}
