import { test } from "node:test";
import assert from "node:assert/strict";
import { Vec3 } from "../src/math/vec3.js";
import { Bivector } from "../src/ga/bivector.js";
import { Rotor } from "../src/ga/rotor.js";
import { near, nearVec, nearRotor, rng } from "./helpers.js";

const HALF_PI = Math.PI / 2;

test("identity rotor leaves vectors unchanged", () => {
  const v = new Vec3(1, -2, 3);
  nearVec(Rotor.identity().rotate(v), v);
});

test("90° about +z sends e1 to e2", () => {
  const r = Rotor.fromAxisAngle(Vec3.e3(), HALF_PI);
  nearVec(r.rotate(Vec3.e1()), Vec3.e2(), 1e-9, "e1→e2");
});

test("90° about +x sends e2 to e3", () => {
  const r = Rotor.fromAxisAngle(Vec3.e1(), HALF_PI);
  nearVec(r.rotate(Vec3.e2()), Vec3.e3(), 1e-9, "e2→e3");
});

test("90° about +y sends e3 to e1", () => {
  const r = Rotor.fromAxisAngle(Vec3.e2(), HALF_PI);
  nearVec(r.rotate(Vec3.e3()), Vec3.e1(), 1e-9, "e3→e1");
});

test("rotation in the e12 plane equals rotation about +z", () => {
  const byPlane = Rotor.fromPlaneAngle(new Bivector(0, 0, 1), 0.7);
  const byAxis = Rotor.fromAxisAngle(Vec3.e3(), 0.7);
  nearRotor(byPlane, byAxis);
});

test("rotation preserves vector length", () => {
  const rand = rng(42);
  const r = Rotor.fromAxisAngle(
    new Vec3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize(),
    1.234,
  );
  const v = new Vec3(3, -1, 2);
  near(r.rotate(v).length(), v.length(), 1e-9, "length");
});

test("composed rotors equal sequential rotation", () => {
  const r1 = Rotor.fromAxisAngle(Vec3.e1(), 0.6);
  const r2 = Rotor.fromAxisAngle(Vec3.e2(), 1.1);
  const v = new Vec3(1, 2, -3);
  // r2.mul(r1) applies r1 first, then r2.
  nearVec(r2.mul(r1).rotate(v), r2.rotate(r1.rotate(v)), 1e-9, "compose");
});

test("a full turn is the identity rotation (double cover)", () => {
  const r = Rotor.fromAxisAngle(Vec3.e3(), 2 * Math.PI);
  const v = new Vec3(0.3, 0.7, -0.5);
  // The rotor is -1, but the rotation it encodes is the identity.
  near(r.a, -1, 1e-9, "rotor scalar is -1");
  nearVec(r.rotate(v), v, 1e-9, "rotation is identity");
});

test("reverse undoes the rotation", () => {
  const r = Rotor.fromAxisAngle(new Vec3(1, 2, 3).normalize(), 2.0);
  const v = new Vec3(-2, 5, 1);
  nearVec(r.reverse().rotate(r.rotate(v)), v, 1e-9, "reverse");
});

test("inverse composes to the identity rotor", () => {
  const r = Rotor.fromAxisAngle(new Vec3(-1, 4, 2).normalize(), 1.3);
  nearRotor(r.mul(r.inverse()), Rotor.identity());
});

test("fromTo rotates one direction onto another", () => {
  const rand = rng(7);
  for (let i = 0; i < 20; i++) {
    const from = new Vec3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize();
    const to = new Vec3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize();
    nearVec(Rotor.fromTo(from, to).rotate(from), to, 1e-9, "fromTo");
  }
});

test("fromTo handles antiparallel vectors", () => {
  const r = Rotor.fromTo(Vec3.e1(), Vec3.e1().negate());
  nearVec(r.rotate(Vec3.e1()), Vec3.e1().negate(), 1e-9, "antiparallel");
});

test("fromTo handles identical vectors", () => {
  const r = Rotor.fromTo(Vec3.e2(), Vec3.e2());
  nearVec(r.rotate(Vec3.e2()), Vec3.e2(), 1e-9, "identical");
});

test("exp and log are inverses on unit rotors", () => {
  const rand = rng(99);
  for (let i = 0; i < 20; i++) {
    const r = Rotor.fromAxisAngle(
      new Vec3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize(),
      rand() * 3,
    );
    nearRotor(Rotor.exp(r.log()), r, 1e-7, "exp(log(R))");
  }
});

test("slerp reaches its endpoints", () => {
  const r0 = Rotor.fromAxisAngle(Vec3.e1(), 0.3);
  const r1 = Rotor.fromAxisAngle(Vec3.e2(), 2.0);
  nearRotor(r0.slerp(r1, 0), r0, 1e-7, "slerp t=0");
  nearRotor(r0.slerp(r1, 1), r1, 1e-7, "slerp t=1");
});

test("slerp halfway bisects the rotation angle", () => {
  const full = Rotor.fromAxisAngle(Vec3.e3(), 1.6);
  const mid = Rotor.identity().slerp(full, 0.5);
  near(mid.angle(), 0.8, 1e-7, "half angle");
});

test("toMatrix3 and fromMatrix3 round-trip", () => {
  const rand = rng(2024);
  for (let i = 0; i < 20; i++) {
    const r = Rotor.fromAxisAngle(
      new Vec3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize(),
      rand() * 6 - 3,
    );
    nearRotor(Rotor.fromMatrix3(r.toMatrix3()), r, 1e-6, "matrix round-trip");
  }
});

test("the rotation matrix is orthonormal", () => {
  const r = Rotor.fromAxisAngle(new Vec3(2, -1, 3).normalize(), 1.0);
  const m = r.toMatrix3();
  const c0 = new Vec3(m[0], m[1], m[2]);
  const c1 = new Vec3(m[3], m[4], m[5]);
  const c2 = new Vec3(m[6], m[7], m[8]);
  near(c0.length(), 1, 1e-9, "|col0|");
  near(c1.length(), 1, 1e-9, "|col1|");
  near(c2.length(), 1, 1e-9, "|col2|");
  near(c0.dot(c1), 0, 1e-9, "col0·col1");
  near(c0.dot(c2), 0, 1e-9, "col0·col2");
});

test("axis and angle recover the constructor inputs", () => {
  const axis = new Vec3(1, -2, 2).normalize();
  const r = Rotor.fromAxisAngle(axis, 1.1);
  near(r.angle(), 1.1, 1e-9, "angle");
  // axis() may return the negative axis paired with the same rotation.
  const recovered = r.axis();
  const aligned = recovered.dot(axis) > 0 ? recovered : recovered.negate();
  nearVec(aligned, axis, 1e-7, "axis");
});

test("fromEuler matches the equivalent composed rotors", () => {
  const composed = Rotor.fromAxisAngle(Vec3.e3(), 0.5)
    .mul(Rotor.fromAxisAngle(Vec3.e2(), 0.3))
    .mul(Rotor.fromAxisAngle(Vec3.e1(), 0.7));
  nearRotor(Rotor.fromEuler(0.7, 0.3, 0.5), composed, 1e-9);
});

test("normalize removes accumulated numerical drift", () => {
  let r = Rotor.identity();
  const step = Rotor.fromAxisAngle(new Vec3(1, 1, 1).normalize(), 0.01);
  for (let i = 0; i < 5000; i++) r = r.mul(step);
  assert.ok(Math.abs(r.norm() - 1) < 1e-3, "norm drifted before normalize");
  near(r.normalize().norm(), 1, 1e-12, "norm after normalize");
});

test("rotor rotation agrees with a hand-built rotation matrix", () => {
  // 30° about +z, the textbook matrix.
  const angle = Math.PI / 6;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const r = Rotor.fromAxisAngle(Vec3.e3(), angle);
  const v = new Vec3(2, -3, 5);
  const expected = new Vec3(c * v.x - s * v.y, s * v.x + c * v.y, v.z);
  nearVec(r.rotate(v), expected, 1e-9, "vs matrix");
});
