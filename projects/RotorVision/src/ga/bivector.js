import { Vec3, _installWedge } from "../math/vec3.js";

/**
 * Bivector — a grade-2 element of the 3D geometric algebra G3.
 *
 * A bivector is an oriented area: a chunk of a plane with a magnitude and a
 * sense of circulation. It is the natural object for describing a rotation,
 * because a rotation happens *in a plane*, not *about an axis*. (The "axis"
 * picture is a 3D-only accident; the plane picture works in every dimension.)
 *
 * G3 has three basis bivectors. We store their coefficients directly:
 *
 *   b23 · e2^e3   — the oriented yz-plane
 *   b31 · e3^e1   — the oriented zx-plane
 *   b12 · e1^e2   — the oriented xy-plane
 *
 * Each basis bivector squares to -1, which is exactly the property that makes
 * rotors behave like "generalised complex numbers".
 */
export class Bivector {
  constructor(b23 = 0, b31 = 0, b12 = 0) {
    this.b23 = b23;
    this.b31 = b31;
    this.b12 = b12;
  }

  static zero() {
    return new Bivector(0, 0, 0);
  }

  /**
   * The wedge (outer) product of two vectors: u ^ v.
   *
   * This is the oriented parallelogram spanned by u and v. Its magnitude is
   * the area of that parallelogram and its orientation is the plane they
   * share. Antisymmetric: u ^ v = -(v ^ u), and u ^ u = 0.
   */
  static wedge(u, v) {
    return new Bivector(
      u.y * v.z - u.z * v.y, // e2^e3
      u.z * v.x - u.x * v.z, // e3^e1
      u.x * v.y - u.y * v.x, // e1^e2
    );
  }

  /**
   * The Hodge dual of a vector: the plane perpendicular to it.
   *
   * This is the bridge between the familiar "axis of rotation" vector and the
   * "plane of rotation" bivector that rotors actually use.
   */
  static fromAxis(axis) {
    return new Bivector(axis.x, axis.y, axis.z);
  }

  /** The Hodge dual of this bivector: the vector perpendicular to its plane. */
  dual() {
    return new Vec3(this.b23, this.b31, this.b12);
  }

  clone() {
    return new Bivector(this.b23, this.b31, this.b12);
  }

  add(b) {
    return new Bivector(this.b23 + b.b23, this.b31 + b.b31, this.b12 + b.b12);
  }

  sub(b) {
    return new Bivector(this.b23 - b.b23, this.b31 - b.b31, this.b12 - b.b12);
  }

  scale(s) {
    return new Bivector(this.b23 * s, this.b31 * s, this.b12 * s);
  }

  negate() {
    return new Bivector(-this.b23, -this.b31, -this.b12);
  }

  /**
   * The magnitude of the bivector.
   *
   * Because every basis bivector squares to -1, the "norm squared" of a
   * bivector B is -(B*B) = b23^2 + b31^2 + b12^2. The magnitude is its root,
   * and it equals the angle (in radians) of the rotation B generates.
   */
  magnitudeSq() {
    return this.b23 * this.b23 + this.b31 * this.b31 + this.b12 * this.b12;
  }

  magnitude() {
    return Math.sqrt(this.magnitudeSq());
  }

  normalize() {
    const m = this.magnitude();
    if (m < 1e-12) return new Bivector(0, 0, 0);
    return this.scale(1 / m);
  }

  equals(b, epsilon = 1e-9) {
    return (
      Math.abs(this.b23 - b.b23) < epsilon &&
      Math.abs(this.b31 - b.b31) < epsilon &&
      Math.abs(this.b12 - b.b12) < epsilon
    );
  }

  toString() {
    const f = (n) => n.toFixed(3);
    return `Bivector(${f(this.b23)} e23, ${f(this.b31)} e31, ${f(this.b12)} e12)`;
  }
}

// Wire Vec3.wedge to the real implementation now that Bivector exists.
_installWedge(Bivector.wedge);
