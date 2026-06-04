import { Vec3 } from "../math/vec3.js";
import { Bivector } from "./bivector.js";

const EPSILON = 1e-10;

/**
 * Rotor — the rotation primitive of RotorVision.
 *
 * A rotor is an even-grade element of the 3D geometric algebra G3: a scalar
 * plus a bivector,
 *
 *     R = a + b23·e23 + b31·e31 + b12·e12
 *
 * It rotates a vector v through the *sandwich product*
 *
 *     v' = R v R~
 *
 * where R~ is the reverse of R. A rotor encodes a rotation as the plane it
 * happens in (the bivector part) and how far through that plane it carries a
 * vector (jointly with the scalar part).
 *
 * Why a rotor and not a quaternion?
 *
 *   - A quaternion's "i, j, k" are abstract symbols whose squaring to -1 is
 *     asserted. A rotor's e23, e31, e12 are concrete oriented planes, and
 *     they square to -1 as a *derived* fact of the geometric product.
 *   - A quaternion rotates with q v q* only after embedding v in a 4D space
 *     of "pure quaternions". A rotor acts on a vector that lives in the same
 *     algebra it does — no embedding, no special cases.
 *   - The construction generalises: the same sandwich product rotates in 2D,
 *     4D or any dimension. Quaternions are stuck in 3D.
 *
 * Numerically a unit rotor and a unit quaternion carry the same four numbers
 * and the same double-cover, so rotors cost nothing over quaternions while
 * being far easier to reason about.
 *
 * Rotors are treated as immutable; every method returns a fresh Rotor.
 */
export class Rotor {
  constructor(a = 1, b23 = 0, b31 = 0, b12 = 0) {
    this.a = a; // scalar part
    this.b23 = b23; // e2^e3 coefficient
    this.b31 = b31; // e3^e1 coefficient
    this.b12 = b12; // e1^e2 coefficient
  }

  /** The identity rotor — leaves every vector unchanged. */
  static identity() {
    return new Rotor(1, 0, 0, 0);
  }

  /**
   * Build a rotor from an axis and an angle (right-hand rule, radians).
   *
   * This is the familiar constructor, but note what it really does: it takes
   * the dual of the axis to recover the *plane* of rotation, then exponentiates
   * half that plane. The half-angle is why the sandwich product needs a rotor
   * on both sides.
   */
  static fromAxisAngle(axis, angle) {
    return Rotor.fromPlaneAngle(Bivector.fromAxis(axis), angle);
  }

  /**
   * Build a rotor that rotates by `angle` radians in the plane of `bivector`.
   *
   * This is the dimension-agnostic constructor: it never mentions an axis. A
   * positive angle carries the plane's first basis direction toward its second
   * (e.g. in the e12 plane, +angle sends e1 toward e2).
   */
  static fromPlaneAngle(bivector, angle) {
    const plane = bivector.normalize();
    if (plane.magnitudeSq() < EPSILON) return Rotor.identity();
    const half = angle * 0.5;
    const s = Math.sin(half);
    // R = cos(half) - sin(half)·plane  ⇒  v' = R v R~ is a right-handed turn.
    return new Rotor(
      Math.cos(half),
      -s * plane.b23,
      -s * plane.b31,
      -s * plane.b12,
    );
  }

  /**
   * The shortest-arc rotor that carries direction `from` onto direction `to`.
   *
   * Built straight from the geometric product: 1 + (to·from) is a rotor whose
   * normalisation is exactly the half-way rotation. No trig, no axis.
   */
  static fromTo(from, to) {
    const u = from.normalize();
    const v = to.normalize();
    const dot = v.dot(u);

    // Antiparallel: the formula is singular, so pick any plane containing u
    // and make a half turn in it.
    if (dot < -1 + EPSILON) {
      let perp = Vec3.e1().cross(u);
      if (perp.lengthSq() < EPSILON) perp = Vec3.e2().cross(u);
      perp = perp.normalize();
      return new Rotor(0, -perp.x, -perp.y, -perp.z);
    }

    // wedge(v, u) is the bivector part of the geometric product v*u.
    const w = Bivector.wedge(v, u);
    return new Rotor(1 + dot, w.b23, w.b31, w.b12).normalize();
  }

  /**
   * The exponential of a bivector: exp(B) = cos|B| + sin|B|·B^.
   *
   * This is the bridge from "a plane and an amount" to "a rotor". Feeding it a
   * bivector of magnitude θ yields a rotor for a rotation of 2θ.
   */
  static exp(bivector) {
    const theta = bivector.magnitude();
    if (theta < EPSILON) {
      // Small-angle limit: sin(θ)/θ → 1.
      return new Rotor(1, bivector.b23, bivector.b31, bivector.b12).normalize();
    }
    const s = Math.sin(theta) / theta;
    return new Rotor(
      Math.cos(theta),
      s * bivector.b23,
      s * bivector.b31,
      s * bivector.b12,
    );
  }

  /**
   * Recover the rotor from a 3×3 rotation matrix (column-major, nine numbers).
   *
   * The inverse of `toMatrix3`. Uses Shepperd's method — pick whichever of the
   * four components is largest to divide by, so the reconstruction stays
   * numerically stable for every rotation. Handy for turning a "look at this"
   * basis into an orientation.
   */
  static fromMatrix3(m) {
    // m[col * 3 + row]
    const m00 = m[0], m10 = m[1], m20 = m[2];
    const m01 = m[3], m11 = m[4], m21 = m[5];
    const m02 = m[6], m12 = m[7], m22 = m[8];
    const trace = m00 + m11 + m22;

    if (trace > 0) {
      const s = 2 * Math.sqrt(trace + 1);
      return new Rotor(
        0.25 * s,
        (m12 - m21) / s,
        (m20 - m02) / s,
        (m01 - m10) / s,
      ).normalize();
    }
    if (m00 > m11 && m00 > m22) {
      const s = 2 * Math.sqrt(1 + m00 - m11 - m22);
      return new Rotor(
        (m12 - m21) / s,
        0.25 * s,
        (m01 + m10) / s,
        (m20 + m02) / s,
      ).normalize();
    }
    if (m11 > m22) {
      const s = 2 * Math.sqrt(1 + m11 - m00 - m22);
      return new Rotor(
        (m20 - m02) / s,
        (m01 + m10) / s,
        0.25 * s,
        (m12 + m21) / s,
      ).normalize();
    }
    const s = 2 * Math.sqrt(1 + m22 - m00 - m11);
    return new Rotor(
      (m01 - m10) / s,
      (m20 + m02) / s,
      (m12 + m21) / s,
      0.25 * s,
    ).normalize();
  }

  /**
   * The rotor whose rotation maps e1, e2, e3 onto the given orthonormal axes.
   */
  static fromBasis(xAxis, yAxis, zAxis) {
    return Rotor.fromMatrix3([
      xAxis.x, xAxis.y, xAxis.z,
      yAxis.x, yAxis.y, yAxis.z,
      zAxis.x, zAxis.y, zAxis.z,
    ]);
  }

  /** Compose three axis rotations (radians) applied in X, then Y, then Z. */
  static fromEuler(x, y, z) {
    const rx = Rotor.fromAxisAngle(Vec3.e1(), x);
    const ry = Rotor.fromAxisAngle(Vec3.e2(), y);
    const rz = Rotor.fromAxisAngle(Vec3.e3(), z);
    return rz.mul(ry).mul(rx);
  }

  clone() {
    return new Rotor(this.a, this.b23, this.b31, this.b12);
  }

  /** The bivector part of the rotor, on its own. */
  bivector() {
    return new Bivector(this.b23, this.b31, this.b12);
  }

  /**
   * The reverse R~ — every bivector flips sign.
   *
   * For a unit rotor the reverse is the inverse: it undoes the rotation. It is
   * the right-hand factor of the sandwich product.
   */
  reverse() {
    return new Rotor(this.a, -this.b23, -this.b31, -this.b12);
  }

  /** The norm |R| = sqrt(R R~). A pure rotation always has norm 1. */
  norm() {
    return Math.sqrt(
      this.a * this.a +
        this.b23 * this.b23 +
        this.b31 * this.b31 +
        this.b12 * this.b12,
    );
  }

  /** Scale the rotor back onto the unit sphere, undoing accumulated drift. */
  normalize() {
    const n = this.norm();
    if (n < EPSILON) return Rotor.identity();
    const inv = 1 / n;
    return new Rotor(
      this.a * inv,
      this.b23 * inv,
      this.b31 * inv,
      this.b12 * inv,
    );
  }

  /** The inverse rotor: R~ / |R|^2 (equals R~ for a unit rotor). */
  inverse() {
    const n2 =
      this.a * this.a +
      this.b23 * this.b23 +
      this.b31 * this.b31 +
      this.b12 * this.b12;
    if (n2 < EPSILON) return Rotor.identity();
    const inv = 1 / n2;
    return new Rotor(
      this.a * inv,
      -this.b23 * inv,
      -this.b31 * inv,
      -this.b12 * inv,
    );
  }

  /** The 4D dot product of two rotors — used to detect the double cover. */
  dot(r) {
    return (
      this.a * r.a +
      this.b23 * r.b23 +
      this.b31 * r.b31 +
      this.b12 * r.b12
    );
  }

  /**
   * Compose two rotors via the geometric product.
   *
   * `a.mul(b)` is the rotor that applies b first and then a — exactly the
   * order in which the sandwich products nest. Composing rotations is just
   * multiplication; no matrices are built.
   */
  mul(r) {
    const { a, b23, b31, b12 } = this;
    return new Rotor(
      a * r.a - b23 * r.b23 - b31 * r.b31 - b12 * r.b12,
      a * r.b23 + b23 * r.a - b31 * r.b12 + b12 * r.b31,
      a * r.b31 + b31 * r.a + b23 * r.b12 - b12 * r.b23,
      a * r.b12 + b12 * r.a - b23 * r.b31 + b31 * r.b23,
    );
  }

  /**
   * Rotate a vector through the sandwich product v' = R v R~.
   *
   * This is the whole point of a rotor. The expression below is the expanded,
   * allocation-light form of (R)(v)(R~); the intermediate `t` is the trivector
   * component that the two halves of the sandwich conspire to cancel.
   */
  rotate(v) {
    const { a, b23, b31, b12 } = this;
    const { x, y, z } = v;

    // First half of the sandwich, R v — its grade-1 (vector) part…
    const p1 = a * x + b12 * y - b31 * z;
    const p2 = a * y - b12 * x + b23 * z;
    const p3 = a * z + b31 * x - b23 * y;
    // …and its grade-3 (trivector) part.
    const t = b23 * x + b31 * y + b12 * z;

    // Second half, (R v) R~ — the trivector pairs with the bivector of R~ to
    // land back in grade 1, leaving a pure vector.
    return new Vec3(
      a * p1 + b12 * p2 - b31 * p3 + b23 * t,
      a * p2 - b12 * p1 + b23 * p3 + b31 * t,
      a * p3 + b31 * p1 - b23 * p2 + b12 * t,
    );
  }

  /**
   * The logarithm: the bivector B for which exp(B) is this rotor.
   *
   * Returns the generating plane scaled by the half-angle, so `log()` and
   * `exp()` are inverses on unit rotors. This is what makes smooth blending
   * possible.
   */
  log() {
    const bm = Math.sqrt(
      this.b23 * this.b23 + this.b31 * this.b31 + this.b12 * this.b12,
    );
    if (bm < EPSILON) {
      // Near the identity; the bivector part is already the logarithm.
      return new Bivector(this.b23, this.b31, this.b12);
    }
    const theta = Math.atan2(bm, this.a);
    const f = theta / bm;
    return new Bivector(this.b23 * f, this.b31 * f, this.b12 * f);
  }

  /** Raise the rotor to a real power — exp(t · log(R)). */
  pow(t) {
    return Rotor.exp(this.log().scale(t));
  }

  /**
   * Smoothly interpolate toward `target` along the geodesic of rotations.
   *
   * Geometric-algebra slerp: walk a fraction t of the relative rotation
   * R^-1·target. The double-cover check keeps the motion on the short way
   * round.
   */
  slerp(target, t) {
    let to = target;
    if (this.dot(to) < 0) {
      to = new Rotor(-to.a, -to.b23, -to.b31, -to.b12);
    }
    const delta = this.inverse().mul(to);
    return this.mul(delta.pow(t)).normalize();
  }

  /** The rotation angle in radians, in the range [0, π]. */
  angle() {
    const bm = Math.sqrt(
      this.b23 * this.b23 + this.b31 * this.b31 + this.b12 * this.b12,
    );
    return 2 * Math.atan2(bm, Math.abs(this.a));
  }

  /** The rotation axis as a unit vector (arbitrary when the angle is zero). */
  axis() {
    const dual = new Vec3(this.b23, this.b31, this.b12);
    if (dual.lengthSq() < EPSILON) return Vec3.e2();
    const sign = this.a < 0 ? 1 : -1;
    return dual.scale(sign).normalize();
  }

  /** Decompose into a plain { axis, angle } description. */
  toAxisAngle() {
    return { axis: this.axis(), angle: this.angle() };
  }

  /**
   * The equivalent 3×3 rotation matrix, column-major.
   *
   * Produced by rotating the three basis vectors — the columns of any rotation
   * matrix are just the images of e1, e2, e3. Handy for handing the rotation
   * to a matrix-based pipeline such as WebGL.
   */
  toMatrix3() {
    const c1 = this.rotate(Vec3.e1());
    const c2 = this.rotate(Vec3.e2());
    const c3 = this.rotate(Vec3.e3());
    return [c1.x, c1.y, c1.z, c2.x, c2.y, c2.z, c3.x, c3.y, c3.z];
  }

  equals(r, epsilon = 1e-9) {
    return (
      Math.abs(this.a - r.a) < epsilon &&
      Math.abs(this.b23 - r.b23) < epsilon &&
      Math.abs(this.b31 - r.b31) < epsilon &&
      Math.abs(this.b12 - r.b12) < epsilon
    );
  }

  toString() {
    const f = (n) => n.toFixed(3);
    return `Rotor(${f(this.a)} + ${f(this.b23)} e23 + ${f(this.b31)} e31 + ${f(this.b12)} e12)`;
  }
}
