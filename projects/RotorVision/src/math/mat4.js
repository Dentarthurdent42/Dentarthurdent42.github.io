import { Vec3 } from "./vec3.js";

/**
 * Mat4 — a 4×4 matrix, stored column-major (the layout WebGL expects).
 *
 * RotorVision does all of its *rotation* with rotors; this matrix type exists
 * for the parts of a pipeline that are inherently matrix-shaped — perspective
 * projection — and as an exit hatch for handing a rotor's rotation to a
 * matrix-based renderer such as WebGL via `Mat4.fromRotor`.
 */
export class Mat4 {
  /** `elements` is 16 numbers in column-major order. */
  constructor(elements) {
    this.e = elements
      ? Float64Array.from(elements)
      : new Float64Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  }

  static identity() {
    return new Mat4();
  }

  /**
   * A perspective projection matrix.
   *
   * Assumes a right-handed camera space looking down -z, mapping the view
   * frustum into normalised device coordinates.
   */
  static perspective(fovY, aspect, near, far) {
    const f = 1 / Math.tan(fovY / 2);
    const nf = 1 / (near - far);
    return new Mat4([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, 2 * far * near * nf, 0,
    ]);
  }

  /** Build a pure-rotation matrix from a rotor. */
  static fromRotor(rotor) {
    const m = rotor.toMatrix3();
    return new Mat4([
      m[0], m[1], m[2], 0,
      m[3], m[4], m[5], 0,
      m[6], m[7], m[8], 0,
      0, 0, 0, 1,
    ]);
  }

  /** Build a translation matrix. */
  static translation(v) {
    return new Mat4([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      v.x, v.y, v.z, 1,
    ]);
  }

  /** A full transform from a rotor, a translation and a uniform/vector scale. */
  static compose(position, rotor, scale) {
    const s = typeof scale === "number" ? new Vec3(scale, scale, scale) : scale;
    const m = rotor.toMatrix3();
    return new Mat4([
      m[0] * s.x, m[1] * s.x, m[2] * s.x, 0,
      m[3] * s.y, m[4] * s.y, m[5] * s.y, 0,
      m[6] * s.z, m[7] * s.z, m[8] * s.z, 0,
      position.x, position.y, position.z, 1,
    ]);
  }

  /** Matrix product `this · other`. */
  mul(other) {
    const a = this.e;
    const b = other.e;
    const out = new Float64Array(16);
    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < 4; row++) {
        out[col * 4 + row] =
          a[row] * b[col * 4] +
          a[row + 4] * b[col * 4 + 1] +
          a[row + 8] * b[col * 4 + 2] +
          a[row + 12] * b[col * 4 + 3];
      }
    }
    return new Mat4(out);
  }

  /** Transform a point, returning the perspective-divided Vec3 result. */
  transformPoint(v) {
    const e = this.e;
    const x = e[0] * v.x + e[4] * v.y + e[8] * v.z + e[12];
    const y = e[1] * v.x + e[5] * v.y + e[9] * v.z + e[13];
    const z = e[2] * v.x + e[6] * v.y + e[10] * v.z + e[14];
    const w = e[3] * v.x + e[7] * v.y + e[11] * v.z + e[15];
    const inv = Math.abs(w) < 1e-12 ? 1 : 1 / w;
    return new Vec3(x * inv, y * inv, z * inv);
  }

  /** The raw column-major array — pass straight to `gl.uniformMatrix4fv`. */
  toArray() {
    return Array.from(this.e);
  }
}
