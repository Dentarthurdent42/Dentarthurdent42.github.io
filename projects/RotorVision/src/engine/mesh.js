import { Vec3 } from "../math/vec3.js";

/**
 * Mesh — raw geometry: a pool of vertices, the triangles that index into it,
 * and optionally a set of standalone line segments (used for things like the
 * ground grid). Geometry is stored in the mesh's own local space; an Object3D
 * is what places it in the world.
 */
export class Mesh {
  /**
   * @param {Vec3[]}     vertices
   * @param {number[][]} faces - triangles as [i, j, k] index triples
   * @param {number[][]} lines - segments as [i, j] index pairs
   */
  constructor(vertices = [], faces = [], lines = []) {
    this.vertices = vertices;
    this.faces = faces;
    this.lines = lines;
  }

  /** Recentre the mesh so its bounding box is symmetric about the origin. */
  center() {
    if (this.vertices.length === 0) return this;
    let min = this.vertices[0].clone();
    let max = this.vertices[0].clone();
    for (const v of this.vertices) {
      min = new Vec3(
        Math.min(min.x, v.x),
        Math.min(min.y, v.y),
        Math.min(min.z, v.z),
      );
      max = new Vec3(
        Math.max(max.x, v.x),
        Math.max(max.y, v.y),
        Math.max(max.z, v.z),
      );
    }
    const mid = min.add(max).scale(0.5);
    this.vertices = this.vertices.map((v) => v.sub(mid));
    return this;
  }
}
