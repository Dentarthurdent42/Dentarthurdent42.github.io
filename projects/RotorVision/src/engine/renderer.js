import { Vec3 } from "../math/vec3.js";

/**
 * Renderer — a small software rasteriser drawing onto a 2D canvas.
 *
 * The pipeline is deliberately matrix-free for everything but the final
 * perspective divide: object vertices are placed in the world with rotors
 * (Object3D), carried into camera space with the camera's reverse rotor, and
 * only then projected. Hidden surfaces are resolved with the painter's
 * algorithm (sort every primitive back-to-front), which keeps the renderer
 * tiny while still handling a full scene of solids and wireframes.
 */
export class Renderer {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.mode = options.mode ?? "solid"; // "solid" | "wireframe"
    this.fog = options.fog ?? true;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = 1;
    this.height = 1;
    this.stats = { faces: 0, drawn: 0 };
  }

  /** Match the drawing buffer to the canvas's displayed size. */
  resize() {
    const w = this.canvas.clientWidth || this.canvas.width;
    const h = this.canvas.clientHeight || this.canvas.height;
    if (w === this.width && h === this.height && this._sized) return;
    this.width = w;
    this.height = h;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this._sized = true;
  }

  render(scene) {
    this.resize();
    const { ctx } = this;
    const W = this.width;
    const H = this.height;

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this._drawBackground(scene, W, H);

    scene.update();

    const camera = scene.camera;
    const aspect = W / H;
    const focal = (1 / Math.tan(camera.fov / 2)) * (H / 2);
    const cx = W / 2;
    const cy = H / 2;
    const near = camera.near;
    const camPos = camera.position;
    const light = scene.light;
    const fogRGB = hexToRgb(scene.background.bottom);

    const project = (c) => ({
      x: cx + (c.x / -c.z) * focal,
      y: cy - (c.y / -c.z) * focal,
    });

    const primitives = [];
    this.stats.faces = 0;

    for (const obj of scene.renderables()) {
      const mesh = obj.mesh;
      const mat = obj.material;
      const wireframe = this.mode === "wireframe" || mat.wireframe;

      // Vertices into world space (rotors) then camera space (reverse rotor).
      const world = mesh.vertices.map((v) => obj.localToWorld(v));
      const cam = world.map((w) => camera.worldToCamera(w));

      for (const [i, j, k] of mesh.faces) {
        this.stats.faces++;
        const c0 = cam[i];
        const c1 = cam[j];
        const c2 = cam[k];
        // Reject triangles that touch or cross the near plane.
        if (c0.z > -near || c1.z > -near || c2.z > -near) continue;

        const w0 = world[i];
        const w1 = world[j];
        const w2 = world[k];
        let normal = w1.sub(w0).cross(w2.sub(w0)).normalize();
        const centroid = w0.add(w1).add(w2).scale(1 / 3);
        const facing = normal.dot(camPos.sub(centroid));
        if (facing <= 0) {
          if (!mat.doubleSided) continue; // back-face culling
          normal = normal.negate();
        }

        const depth = (c0.z + c1.z + c2.z) / 3;
        const points = [project(c0), project(c1), project(c2)];
        const color = this._shade(normal, mat.color, light, scene.ambient, depth, fogRGB);
        primitives.push({
          kind: wireframe ? "wire" : "fill",
          points,
          depth,
          color,
          renderOrder: mat.renderOrder ?? 0,
        });
      }

      for (let li = 0; li < mesh.lines.length; li++) {
        const [i, j] = mesh.lines[li];
        let a = cam[i];
        let b = cam[j];
        // Reject the segment only if *both* endpoints are on the wrong side
        // of the near plane; otherwise clip the offending endpoint to the
        // plane so segments that straddle it still render their visible part.
        if (a.z > -near && b.z > -near) continue;
        if (a.z > -near) a = clipToNearPlane(a, b, near);
        else if (b.z > -near) b = clipToNearPlane(b, a, near);
        const depth = (a.z + b.z) / 2;
        // Per-edge colours (used by 4D wireframes to tint by w) fall back to
        // the material colour when absent.
        const baseColor = mesh.lineColors ? mesh.lineColors[li] : mat.color;
        primitives.push({
          kind: "line",
          points: [project(a), project(b)],
          depth,
          color: rgbToCss(applyFog(baseColor, depth, fogRGB, this.fog, camera.far)),
          renderOrder: mat.renderOrder ?? 0,
        });
      }
    }

    // Painter's algorithm: lower-renderOrder layers first, and within each
    // layer the farthest (most negative camera z) primitive first. The layer
    // key is the escape hatch for cases where two primitives have overlapping
    // depth ranges yet a clear front/back relationship — e.g. a floor that
    // should sit behind every solid object even when their depths interleave.
    primitives.sort(
      (a, b) => a.renderOrder - b.renderOrder || a.depth - b.depth,
    );
    this.stats.drawn = primitives.length;

    for (const prim of primitives) {
      const p = prim.points;
      if (prim.kind === "line") {
        ctx.strokeStyle = prim.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p[0].x, p[0].y);
        ctx.lineTo(p[1].x, p[1].y);
        ctx.stroke();
        continue;
      }
      ctx.beginPath();
      ctx.moveTo(p[0].x, p[0].y);
      ctx.lineTo(p[1].x, p[1].y);
      ctx.lineTo(p[2].x, p[2].y);
      ctx.closePath();
      if (prim.kind === "fill") {
        ctx.fillStyle = prim.color;
        // Stroke with the same colour to close hairline gaps between facets.
        ctx.strokeStyle = prim.color;
        ctx.lineWidth = 1;
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.strokeStyle = prim.color;
        ctx.lineWidth = 1.1;
        ctx.stroke();
      }
    }
  }

  _drawBackground(scene, W, H) {
    const { ctx } = this;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, scene.background.top);
    g.addColorStop(1, scene.background.bottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  /** Lambert shading with an ambient term, then optional distance fog. */
  _shade(normal, color, light, ambient, depth, fogRGB) {
    const ndl = Math.max(0, normal.dot(light.direction.negate()));
    const lit = {
      r: color.r * (ambient + ndl * light.intensity * (light.color.r / 255)),
      g: color.g * (ambient + ndl * light.intensity * (light.color.g / 255)),
      b: color.b * (ambient + ndl * light.intensity * (light.color.b / 255)),
    };
    return rgbToCss(applyFog(lit, depth, fogRGB, this.fog, 200));
  }
}

/**
 * Move `outside` along the segment toward `inside` until it lands on the near
 * plane (z = -near). The two endpoints must straddle the plane.
 */
function clipToNearPlane(outside, inside, near) {
  const t = (-near - outside.z) / (inside.z - outside.z);
  return new Vec3(
    outside.x + t * (inside.x - outside.x),
    outside.y + t * (inside.y - outside.y),
    -near,
  );
}

function applyFog(color, depth, fogRGB, enabled, far) {
  if (!enabled) return color;
  const dist = -depth;
  const start = far * 0.3;
  const end = far * 0.95;
  const t = clamp((dist - start) / (end - start), 0, 1);
  return {
    r: color.r + (fogRGB.r - color.r) * t,
    g: color.g + (fogRGB.g - color.g) * t,
    b: color.b + (fogRGB.b - color.b) * t,
  };
}

function rgbToCss(c) {
  return `rgb(${clamp(c.r, 0, 255) | 0}, ${clamp(c.g, 0, 255) | 0}, ${clamp(c.b, 0, 255) | 0})`;
}

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}
