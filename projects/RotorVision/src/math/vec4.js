/**
 * Vec4 — a grade-1 element of the 4D geometric algebra G4.
 *
 * The fourth coordinate `w` is a spatial axis exactly like x, y, z — not time,
 * not a homogeneous coordinate. A Rotor4 acts on a Vec4 through the very same
 * sandwich product that a Rotor uses in 3D; that the formula is unchanged is
 * the whole point of rotors. Immutable: every method returns a fresh Vec4.
 */
export class Vec4 {
  constructor(x = 0, y = 0, z = 0, w = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }

  static zero() {
    return new Vec4(0, 0, 0, 0);
  }

  static e1() {
    return new Vec4(1, 0, 0, 0);
  }

  static e2() {
    return new Vec4(0, 1, 0, 0);
  }

  static e3() {
    return new Vec4(0, 0, 1, 0);
  }

  static e4() {
    return new Vec4(0, 0, 0, 1);
  }

  clone() {
    return new Vec4(this.x, this.y, this.z, this.w);
  }

  add(v) {
    return new Vec4(this.x + v.x, this.y + v.y, this.z + v.z, this.w + v.w);
  }

  sub(v) {
    return new Vec4(this.x - v.x, this.y - v.y, this.z - v.z, this.w - v.w);
  }

  scale(s) {
    return new Vec4(this.x * s, this.y * s, this.z * s, this.w * s);
  }

  negate() {
    return new Vec4(-this.x, -this.y, -this.z, -this.w);
  }

  dot(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w;
  }

  lengthSq() {
    return this.dot(this);
  }

  length() {
    return Math.sqrt(this.lengthSq());
  }

  normalize() {
    const len = this.length();
    if (len < 1e-12) return new Vec4(0, 0, 0, 0);
    return this.scale(1 / len);
  }

  equals(v, epsilon = 1e-9) {
    return (
      Math.abs(this.x - v.x) < epsilon &&
      Math.abs(this.y - v.y) < epsilon &&
      Math.abs(this.z - v.z) < epsilon &&
      Math.abs(this.w - v.w) < epsilon
    );
  }

  toArray() {
    return [this.x, this.y, this.z, this.w];
  }

  toString() {
    const f = (n) => n.toFixed(3);
    return `Vec4(${f(this.x)}, ${f(this.y)}, ${f(this.z)}, ${f(this.w)})`;
  }
}
