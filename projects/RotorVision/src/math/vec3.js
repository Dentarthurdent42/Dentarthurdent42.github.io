/**
 * Vec3 — a grade-1 element of the 3D geometric algebra G3.
 *
 * In RotorVision a vector is more than an (x, y, z) triple: it is the object
 * that rotors act on through the sandwich product. Keeping it immutable makes
 * the algebra easy to reason about; every operation returns a fresh Vec3.
 */
export class Vec3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  static zero() {
    return new Vec3(0, 0, 0);
  }

  /** Basis vector e1. */
  static e1() {
    return new Vec3(1, 0, 0);
  }

  /** Basis vector e2. */
  static e2() {
    return new Vec3(0, 1, 0);
  }

  /** Basis vector e3. */
  static e3() {
    return new Vec3(0, 0, 1);
  }

  static fromArray([x, y, z]) {
    return new Vec3(x, y, z);
  }

  clone() {
    return new Vec3(this.x, this.y, this.z);
  }

  add(v) {
    return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z);
  }

  sub(v) {
    return new Vec3(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  scale(s) {
    return new Vec3(this.x * s, this.y * s, this.z * s);
  }

  negate() {
    return new Vec3(-this.x, -this.y, -this.z);
  }

  /** Component-wise (Hadamard) product — used for non-uniform scaling. */
  mulComponents(v) {
    return new Vec3(this.x * v.x, this.y * v.y, this.z * v.z);
  }

  /** The symmetric part of the geometric product: a scalar. */
  dot(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  /**
   * The antisymmetric part of the geometric product: a Bivector.
   *
   * The wedge product u ^ v is the oriented plane segment spanned by the two
   * vectors. It is what a rotor is ultimately built from. Imported lazily to
   * avoid a circular module dependency with bivector.js.
   */
  wedge(v) {
    return wedge(this, v);
  }

  /** The conventional 3D cross product (the dual of the wedge product). */
  cross(v) {
    return new Vec3(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x,
    );
  }

  lengthSq() {
    return this.dot(this);
  }

  length() {
    return Math.sqrt(this.lengthSq());
  }

  normalize() {
    const len = this.length();
    if (len < 1e-12) return new Vec3(0, 0, 0);
    return this.scale(1 / len);
  }

  distanceTo(v) {
    return this.sub(v).length();
  }

  lerp(v, t) {
    return new Vec3(
      this.x + (v.x - this.x) * t,
      this.y + (v.y - this.y) * t,
      this.z + (v.z - this.z) * t,
    );
  }

  equals(v, epsilon = 1e-9) {
    return (
      Math.abs(this.x - v.x) < epsilon &&
      Math.abs(this.y - v.y) < epsilon &&
      Math.abs(this.z - v.z) < epsilon
    );
  }

  toArray() {
    return [this.x, this.y, this.z];
  }

  toString() {
    const f = (n) => n.toFixed(3);
    return `Vec3(${f(this.x)}, ${f(this.y)}, ${f(this.z)})`;
  }
}

// Resolved after Bivector is defined to keep the modules decoupled at import
// time while still letting Vec3.wedge return a real Bivector.
let wedge = () => {
  throw new Error("Vec3.wedge: bivector module not yet initialised");
};

export function _installWedge(fn) {
  wedge = fn;
}
