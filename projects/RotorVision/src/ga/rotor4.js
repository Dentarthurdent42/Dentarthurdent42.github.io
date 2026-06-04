import { Vec4 } from "../math/vec4.js";
import { geometricProduct, BLADE } from "./cl4.js";

const EPSILON = 1e-10;

/**
 * Bivector4 — a grade-2 element of G4: an oriented plane in four dimensions.
 *
 * Where 3D has three basis planes, 4D has six — one for each pair of axes:
 *
 *   e12 (xy)  e13 (xz)  e14 (xw)  e23 (yz)  e24 (yw)  e34 (zw)
 *
 * That extra count is the whole story of why 4D rotation is richer: a 4D
 * rotation can spin in two completely orthogonal planes at once (say e12 and
 * e34), something with no axis and no 3D analogue.
 */
export class Bivector4 {
  constructor(b12 = 0, b13 = 0, b14 = 0, b23 = 0, b24 = 0, b34 = 0) {
    this.b12 = b12;
    this.b13 = b13;
    this.b14 = b14;
    this.b23 = b23;
    this.b24 = b24;
    this.b34 = b34;
  }

  /**
   * The plane spanned by two 4D vectors: the wedge (outer) product u ∧ v.
   *
   * A wedge of two vectors is always a *simple* bivector — an honest single
   * plane — so the result is always safe to hand to `Rotor4.fromPlaneAngle`.
   * This is how you rotate in a tilted plane rather than a basis plane.
   */
  static fromVectors(u, v) {
    return new Bivector4(
      u.x * v.y - u.y * v.x, // e12
      u.x * v.z - u.z * v.x, // e13
      u.x * v.w - u.w * v.x, // e14
      u.y * v.z - u.z * v.y, // e23
      u.y * v.w - u.w * v.y, // e24
      u.z * v.w - u.w * v.z, // e34
    );
  }

  // The six basis planes, by their axis pair.
  static xy() { return new Bivector4(1, 0, 0, 0, 0, 0); }
  static xz() { return new Bivector4(0, 1, 0, 0, 0, 0); }
  static xw() { return new Bivector4(0, 0, 1, 0, 0, 0); }
  static yz() { return new Bivector4(0, 0, 0, 1, 0, 0); }
  static yw() { return new Bivector4(0, 0, 0, 0, 1, 0); }
  static zw() { return new Bivector4(0, 0, 0, 0, 0, 1); }

  add(b) {
    return new Bivector4(
      this.b12 + b.b12, this.b13 + b.b13, this.b14 + b.b14,
      this.b23 + b.b23, this.b24 + b.b24, this.b34 + b.b34,
    );
  }

  scale(s) {
    return new Bivector4(
      this.b12 * s, this.b13 * s, this.b14 * s,
      this.b23 * s, this.b24 * s, this.b34 * s,
    );
  }

  magnitudeSq() {
    return (
      this.b12 * this.b12 + this.b13 * this.b13 + this.b14 * this.b14 +
      this.b23 * this.b23 + this.b24 * this.b24 + this.b34 * this.b34
    );
  }

  magnitude() {
    return Math.sqrt(this.magnitudeSq());
  }

  normalize() {
    const m = this.magnitude();
    if (m < EPSILON) return new Bivector4();
    return this.scale(1 / m);
  }

  /**
   * Is this a *simple* bivector — a single honest plane rather than a blend of
   * two? A bivector is simple iff B ∧ B = 0, which in 4D is the condition
   * b12·b34 − b13·b24 + b14·b23 = 0. Only simple bivectors exponentiate to a
   * single-plane rotation via the cos/sin formula.
   */
  isSimple(epsilon = 1e-9) {
    const wedge = this.b12 * this.b34 - this.b13 * this.b24 + this.b14 * this.b23;
    return Math.abs(wedge) < epsilon;
  }
}

/**
 * Rotor4 — the rotation primitive in four dimensions.
 *
 * A 4D rotor is an even-grade element of G4: a scalar, the six bivectors, and
 * the grade-4 pseudoscalar e1234,
 *
 *   R = s + (b12 e12 + … + b34 e34) + b1234 e1234
 *
 * It rotates a Vec4 by exactly the same sandwich product as in 3D,
 *
 *   v' = R v R~
 *
 * No quaternion can do this — a quaternion lives in 3D and rotates 3D vectors,
 * full stop. The rotor's construction (exponentiate a plane, sandwich a
 * vector) is dimension-agnostic, so the identical idea carries to 4D, where it
 * captures genuinely four-dimensional motions like the double rotation.
 *
 * The pseudoscalar term is what 3D never needed: in 4D the product of two
 * rotations in different planes can leave a grade-4 residue, and a faithful
 * rotor has to carry it.
 */
export class Rotor4 {
  constructor(s = 1, b12 = 0, b13 = 0, b14 = 0, b23 = 0, b24 = 0, b34 = 0, b1234 = 0) {
    this.s = s; // scalar
    this.b12 = b12;
    this.b13 = b13;
    this.b14 = b14;
    this.b23 = b23;
    this.b24 = b24;
    this.b34 = b34;
    this.b1234 = b1234; // pseudoscalar
  }

  static identity() {
    return new Rotor4(1, 0, 0, 0, 0, 0, 0, 0);
  }

  /**
   * A simple rotation: turn by `angle` radians within the plane of a *simple*
   * unit bivector. R = cos(θ/2) − sin(θ/2)·B̂, the 4D twin of the 3D
   * constructor. A positive angle carries the plane's first axis toward its
   * second (e.g. in e12, +angle sends e1 toward e2).
   */
  static fromPlaneAngle(bivector, angle) {
    const b = bivector.normalize();
    if (b.magnitudeSq() < EPSILON) return Rotor4.identity();
    const half = angle * 0.5;
    const sin = Math.sin(half);
    return new Rotor4(
      Math.cos(half),
      -sin * b.b12, -sin * b.b13, -sin * b.b14,
      -sin * b.b23, -sin * b.b24, -sin * b.b34,
      0,
    );
  }

  /**
   * A double rotation: spin by `angleA` in plane `planeA` and simultaneously
   * by `angleB` in plane `planeB`. When the two planes are completely
   * orthogonal (they share no axis, e.g. e12 and e34) this is the canonical 4D
   * motion that cannot be reduced to a rotation about any axis. Built by
   * composing two simple rotors — composition is just the geometric product.
   */
  static doubleRotation(planeA, angleA, planeB, angleB) {
    return Rotor4.fromPlaneAngle(planeA, angleA).mul(
      Rotor4.fromPlaneAngle(planeB, angleB),
    );
  }

  clone() {
    return new Rotor4(
      this.s, this.b12, this.b13, this.b14,
      this.b23, this.b24, this.b34, this.b1234,
    );
  }

  /** Pack into a length-16 multivector for the Cl4 product machinery. */
  _toMultivector() {
    const mv = new Float64Array(16);
    mv[BLADE.S] = this.s;
    mv[BLADE.E12] = this.b12;
    mv[BLADE.E13] = this.b13;
    mv[BLADE.E14] = this.b14;
    mv[BLADE.E23] = this.b23;
    mv[BLADE.E24] = this.b24;
    mv[BLADE.E34] = this.b34;
    mv[BLADE.E1234] = this.b1234;
    return mv;
  }

  static _fromMultivector(mv) {
    return new Rotor4(
      mv[BLADE.S],
      mv[BLADE.E12], mv[BLADE.E13], mv[BLADE.E14],
      mv[BLADE.E23], mv[BLADE.E24], mv[BLADE.E34],
      mv[BLADE.E1234],
    );
  }

  /**
   * The reverse R~. Reversion flips a blade of grade k by (−1)^(k(k−1)/2):
   * scalars and the grade-4 pseudoscalar are unchanged, the six bivectors flip
   * sign. For a unit rotor the reverse is the inverse.
   */
  reverse() {
    return new Rotor4(
      this.s,
      -this.b12, -this.b13, -this.b14,
      -this.b23, -this.b24, -this.b34,
      this.b1234,
    );
  }

  norm() {
    return Math.sqrt(
      this.s * this.s +
        this.b12 * this.b12 + this.b13 * this.b13 + this.b14 * this.b14 +
        this.b23 * this.b23 + this.b24 * this.b24 + this.b34 * this.b34 +
        this.b1234 * this.b1234,
    );
  }

  normalize() {
    const n = this.norm();
    if (n < EPSILON) return Rotor4.identity();
    const inv = 1 / n;
    return new Rotor4(
      this.s * inv,
      this.b12 * inv, this.b13 * inv, this.b14 * inv,
      this.b23 * inv, this.b24 * inv, this.b34 * inv,
      this.b1234 * inv,
    );
  }

  /** Compose two rotors. `a.mul(b)` applies b first, then a. */
  mul(r) {
    return Rotor4._fromMultivector(
      geometricProduct(this._toMultivector(), r._toMultivector()),
    );
  }

  /**
   * Rotate a Vec4 through the sandwich product v' = R v R~.
   *
   * The same three-factor product as 3D, evaluated with the full Cl(4,0)
   * geometric product. R v lands in grades 1 and 3; the trailing R~ brings the
   * grade-3 part back down, leaving a pure 4D vector.
   */
  rotate(v) {
    const mv = new Float64Array(16);
    mv[BLADE.E1] = v.x;
    mv[BLADE.E2] = v.y;
    mv[BLADE.E3] = v.z;
    mv[BLADE.E4] = v.w;
    const R = this._toMultivector();
    const result = geometricProduct(
      geometricProduct(R, mv),
      this.reverse()._toMultivector(),
    );
    return new Vec4(
      result[BLADE.E1],
      result[BLADE.E2],
      result[BLADE.E3],
      result[BLADE.E4],
    );
  }

  /**
   * The 4×4 rotation matrix, column-major: the images of e1, e2, e3, e4 under
   * the sandwich product. Convenient for transforming many vertices at once.
   */
  toMatrix4() {
    const c1 = this.rotate(Vec4.e1());
    const c2 = this.rotate(Vec4.e2());
    const c3 = this.rotate(Vec4.e3());
    const c4 = this.rotate(Vec4.e4());
    return [
      c1.x, c1.y, c1.z, c1.w,
      c2.x, c2.y, c2.z, c2.w,
      c3.x, c3.y, c3.z, c3.w,
      c4.x, c4.y, c4.z, c4.w,
    ];
  }

  equals(r, epsilon = 1e-9) {
    return (
      Math.abs(this.s - r.s) < epsilon &&
      Math.abs(this.b12 - r.b12) < epsilon &&
      Math.abs(this.b13 - r.b13) < epsilon &&
      Math.abs(this.b14 - r.b14) < epsilon &&
      Math.abs(this.b23 - r.b23) < epsilon &&
      Math.abs(this.b24 - r.b24) < epsilon &&
      Math.abs(this.b34 - r.b34) < epsilon &&
      Math.abs(this.b1234 - r.b1234) < epsilon
    );
  }

  toString() {
    const f = (n) => n.toFixed(3);
    return (
      `Rotor4(${f(this.s)} + ${f(this.b12)} e12 + ${f(this.b13)} e13 + ` +
      `${f(this.b14)} e14 + ${f(this.b23)} e23 + ${f(this.b24)} e24 + ` +
      `${f(this.b34)} e34 + ${f(this.b1234)} e1234)`
    );
  }
}
