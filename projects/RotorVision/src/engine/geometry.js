import { Vec3 } from "../math/vec3.js";
import { Rotor } from "../ga/rotor.js";
import { Mesh } from "./mesh.js";

/**
 * Geometry — a small library of procedural meshes.
 *
 * Every primitive is built so its triangles wind counter-clockwise when seen
 * from outside, which is what lets the renderer cull back faces. The torus
 * knot is the showpiece: its tube is swept with a parallel-transport frame
 * whose every step is a rotor (see `torusKnot`).
 */
export const Geometry = {
  /** An axis-aligned box centred on the origin. */
  box(width = 1, height = 1, depth = 1) {
    const hw = width / 2;
    const hh = height / 2;
    const hd = depth / 2;
    const vertices = [
      new Vec3(-hw, -hh, -hd), // 0
      new Vec3(hw, -hh, -hd), // 1
      new Vec3(hw, hh, -hd), // 2
      new Vec3(-hw, hh, -hd), // 3
      new Vec3(-hw, -hh, hd), // 4
      new Vec3(hw, -hh, hd), // 5
      new Vec3(hw, hh, hd), // 6
      new Vec3(-hw, hh, hd), // 7
    ];
    const faces = [
      [4, 5, 6], [4, 6, 7], // +z front
      [1, 0, 3], [1, 3, 2], // -z back
      [1, 2, 6], [1, 6, 5], // +x right
      [0, 4, 7], [0, 7, 3], // -x left
      [3, 6, 2], [3, 7, 6], // +y top
      [0, 1, 5], [0, 5, 4], // -y bottom
    ];
    return new Mesh(vertices, faces);
  },

  /** A UV sphere. */
  sphere(radius = 1, segments = 24, rings = 16) {
    const vertices = [];
    const faces = [];
    for (let ring = 0; ring <= rings; ring++) {
      const phi = (ring / rings) * Math.PI;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);
      for (let seg = 0; seg <= segments; seg++) {
        const theta = (seg / segments) * Math.PI * 2;
        vertices.push(
          new Vec3(
            -radius * sinPhi * Math.cos(theta),
            radius * cosPhi,
            radius * sinPhi * Math.sin(theta),
          ),
        );
      }
    }
    const stride = segments + 1;
    for (let ring = 0; ring < rings; ring++) {
      for (let seg = 0; seg < segments; seg++) {
        const a = ring * stride + seg;
        const b = a + 1;
        const c = a + stride;
        const d = c + 1;
        faces.push([a, c, b], [b, c, d]);
      }
    }
    return new Mesh(vertices, faces);
  },

  /** A torus (a doughnut) of major radius R and tube radius r. */
  torus(R = 1, r = 0.4, segMajor = 36, segMinor = 18) {
    const vertices = [];
    const faces = [];
    for (let i = 0; i <= segMajor; i++) {
      const u = (i / segMajor) * Math.PI * 2;
      const cosU = Math.cos(u);
      const sinU = Math.sin(u);
      for (let j = 0; j <= segMinor; j++) {
        const v = (j / segMinor) * Math.PI * 2;
        const ring = R + r * Math.cos(v);
        vertices.push(
          new Vec3(ring * cosU, r * Math.sin(v), ring * sinU),
        );
      }
    }
    const stride = segMinor + 1;
    for (let i = 0; i < segMajor; i++) {
      for (let j = 0; j < segMinor; j++) {
        const a = i * stride + j;
        const b = a + 1;
        const c = a + stride;
        const d = c + 1;
        faces.push([a, b, c], [b, d, c]);
      }
    }
    return new Mesh(vertices, faces);
  },

  /** A regular octahedron — eight triangular faces. */
  octahedron(radius = 1) {
    const vertices = [
      new Vec3(radius, 0, 0), // 0 +x
      new Vec3(-radius, 0, 0), // 1 -x
      new Vec3(0, radius, 0), // 2 +y
      new Vec3(0, -radius, 0), // 3 -y
      new Vec3(0, 0, radius), // 4 +z
      new Vec3(0, 0, -radius), // 5 -z
    ];
    const faces = [
      [2, 4, 0], [2, 0, 5], [2, 5, 1], [2, 1, 4],
      [3, 0, 4], [3, 5, 0], [3, 1, 5], [3, 4, 1],
    ];
    return new Mesh(vertices, faces);
  },

  /**
   * A (p, q) torus knot, rendered as a solid tube.
   *
   * The tube is swept with a parallel-transport frame: the cross-section is
   * carried from one sample of the curve to the next by the rotor that maps
   * the old tangent onto the new one (`Rotor.fromTo`). That keeps the tube
   * from twisting, and it means even RotorVision's geometry is built out of
   * rotors.
   */
  torusKnot(
    radius = 1,
    tube = 0.32,
    curveSegments = 220,
    tubeSegments = 14,
    p = 2,
    q = 3,
  ) {
    const point = (u) => {
      const quOverP = (q / p) * u;
      const cs = Math.cos(quOverP);
      const r = (2 + cs) * 0.5 * radius;
      return new Vec3(
        r * Math.cos(u),
        r * Math.sin(u),
        radius * Math.sin(quOverP) * 0.5,
      );
    };

    // Sample the curve and its tangents.
    const centers = [];
    const tangents = [];
    for (let i = 0; i < curveSegments; i++) {
      const u = (i / curveSegments) * Math.PI * 2 * p;
      const du = 0.001;
      centers.push(point(u));
      tangents.push(point(u + du).sub(point(u - du)).normalize());
    }

    // Parallel-transport a reference frame along the curve with rotors.
    let normal = tangents[0].cross(Vec3.e2());
    if (normal.lengthSq() < 1e-6) normal = tangents[0].cross(Vec3.e1());
    normal = normal.normalize();
    const normals = [normal];
    for (let i = 1; i < curveSegments; i++) {
      const transport = Rotor.fromTo(tangents[i - 1], tangents[i]);
      normal = transport.rotate(normal).normalize();
      normals.push(normal);
    }

    // The frame doesn't return to itself when carried around a closed curve —
    // a closed loop on a curved manifold has nonzero *holonomy*. Without
    // correction the wrap-around faces would stitch each vertex j to the
    // vertex on the far side of the next ring. Measure the residual twist by
    // closing the loop once more, then untwist evenly across every sample so
    // the per-segment defect shrinks like 1/N.
    if (curveSegments > 1) {
      const closing = Rotor.fromTo(
        tangents[curveSegments - 1],
        tangents[0],
      );
      const closedNormal = closing.rotate(normals[curveSegments - 1]);
      const binormal0 = tangents[0].cross(normals[0]).normalize();
      const holonomy = Math.atan2(
        closedNormal.dot(binormal0),
        closedNormal.dot(normals[0]),
      );
      for (let i = 0; i < curveSegments; i++) {
        const detwist = Rotor.fromAxisAngle(
          tangents[i],
          -holonomy * (i / curveSegments),
        );
        normals[i] = detwist.rotate(normals[i]).normalize();
      }
    }

    const vertices = [];
    const faces = [];
    for (let i = 0; i < curveSegments; i++) {
      const n = normals[i];
      const b = tangents[i].cross(n).normalize();
      for (let j = 0; j < tubeSegments; j++) {
        const a = (j / tubeSegments) * Math.PI * 2;
        const offset = n
          .scale(Math.cos(a) * tube)
          .add(b.scale(Math.sin(a) * tube));
        vertices.push(centers[i].add(offset));
      }
    }
    for (let i = 0; i < curveSegments; i++) {
      const iNext = (i + 1) % curveSegments;
      for (let j = 0; j < tubeSegments; j++) {
        const jNext = (j + 1) % tubeSegments;
        const a = i * tubeSegments + j;
        const c = i * tubeSegments + jNext;
        const d = iNext * tubeSegments + j;
        const e = iNext * tubeSegments + jNext;
        faces.push([a, c, d], [c, e, d]);
      }
    }
    return new Mesh(vertices, faces);
  },

  /**
   * A flat wireframe grid on the y = `height` plane, drawn as line segments.
   *
   * The grid is built as a lattice of short edges between every adjacent pair
   * of lattice points rather than as long lines across the whole plane. Short
   * segments make their midpoint depth a faithful proxy for their actual
   * depth, so the painter's-algorithm sort lands them in the right place
   * relative to objects above the floor.
   */
  grid(size = 10, divisions = 10, height = 0) {
    const vertices = [];
    const lines = [];
    const step = size / divisions;
    const half = size / 2;
    const stride = divisions + 1;
    for (let r = 0; r <= divisions; r++) {
      for (let c = 0; c <= divisions; c++) {
        vertices.push(new Vec3(-half + c * step, height, -half + r * step));
      }
    }
    for (let r = 0; r <= divisions; r++) {
      for (let c = 0; c < divisions; c++) {
        lines.push([r * stride + c, r * stride + c + 1]);
      }
    }
    for (let c = 0; c <= divisions; c++) {
      for (let r = 0; r < divisions; r++) {
        lines.push([r * stride + c, (r + 1) * stride + c]);
      }
    }
    return new Mesh(vertices, [], lines);
  },
};
