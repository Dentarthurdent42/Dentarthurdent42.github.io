import { Vec4 } from "../math/vec4.js";

/**
 * Geometry4 — procedural 4D polytopes, given as 4D vertices plus the edges
 * between them. They are meant to be rendered as wireframes (an Object4D
 * projects them to 3D each frame), so only vertices and edges are produced.
 */
export const Geometry4 = {
  /**
   * The tesseract (8-cell / hypercube): the 4D analogue of a cube.
   *
   * 16 vertices at every (±s, ±s, ±s, ±s); an edge joins two vertices that
   * differ in exactly one coordinate, giving 32 edges. Under a rotation that
   * involves the w axis its "inner" and "outer" cubes appear to turn inside
   * out — the hallmark of seeing a 4D object.
   */
  tesseract(size = 1) {
    const vertices = [];
    for (let i = 0; i < 16; i++) {
      vertices.push(
        new Vec4(
          i & 1 ? size : -size,
          i & 2 ? size : -size,
          i & 4 ? size : -size,
          i & 8 ? size : -size,
        ),
      );
    }
    const edges = [];
    for (let i = 0; i < 16; i++) {
      for (let bit = 0; bit < 4; bit++) {
        const j = i ^ (1 << bit);
        if (i < j) edges.push([i, j]); // one edge per differing-by-one pair
      }
    }
    return { vertices, edges };
  },

  /**
   * The 16-cell (hyperoctahedron / 4-orthoplex): the 4D analogue of the
   * octahedron. 8 vertices at ±s along each axis; every pair of vertices is
   * joined except antipodes, giving 24 edges.
   */
  cell16(size = 1) {
    const vertices = [
      new Vec4(size, 0, 0, 0), new Vec4(-size, 0, 0, 0),
      new Vec4(0, size, 0, 0), new Vec4(0, -size, 0, 0),
      new Vec4(0, 0, size, 0), new Vec4(0, 0, -size, 0),
      new Vec4(0, 0, 0, size), new Vec4(0, 0, 0, -size),
    ];
    const edges = [];
    for (let i = 0; i < 8; i++) {
      for (let j = i + 1; j < 8; j++) {
        // Skip antipodal pairs (0,1), (2,3), (4,5), (6,7).
        if ((i ^ 1) === j) continue;
        edges.push([i, j]);
      }
    }
    return { vertices, edges };
  },

  /**
   * The 5-cell (4-simplex / pentachoron): the 4D analogue of the tetrahedron,
   * and the simplest regular 4-polytope. Five mutually equidistant vertices
   * (a complete graph, 10 edges).
   *
   * The vertices are the columns of the Helmert contrast matrix for R^5: an
   * orthonormal embedding of the regular simplex into the sum-zero hyperplane,
   * which is exactly four-dimensional.
   */
  cell5(size = 1) {
    const vertices = [];
    for (let i = 0; i < 5; i++) {
      const c = [0, 0, 0, 0];
      for (let k = 1; k <= 4; k++) {
        const norm = Math.sqrt(k * (k + 1));
        c[k - 1] = i < k ? 1 / norm : i === k ? -k / norm : 0;
      }
      // Scale so the circumradius matches `size`.
      vertices.push(new Vec4(c[0], c[1], c[2], c[3]).scale(size * Math.sqrt(2)));
    }
    const edges = [];
    for (let i = 0; i < 5; i++)
      for (let j = i + 1; j < 5; j++) edges.push([i, j]);
    return { vertices, edges };
  },
};
