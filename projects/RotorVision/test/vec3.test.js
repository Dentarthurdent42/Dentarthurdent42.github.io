import { test } from "node:test";
import { Vec3 } from "../src/math/vec3.js";
import { Mat4 } from "../src/math/mat4.js";
import { Rotor } from "../src/ga/rotor.js";
import { near, nearVec } from "./helpers.js";

test("dot product matches the component sum", () => {
  near(new Vec3(1, 2, 3).dot(new Vec3(4, -5, 6)), 4 - 10 + 18, 1e-12);
});

test("cross product is perpendicular to both inputs", () => {
  const u = new Vec3(1, 2, 3);
  const v = new Vec3(-2, 1, 4);
  const w = u.cross(v);
  near(w.dot(u), 0, 1e-12, "⊥ u");
  near(w.dot(v), 0, 1e-12, "⊥ v");
});

test("normalize yields a unit vector", () => {
  near(new Vec3(3, 4, 12).normalize().length(), 1, 1e-12);
});

test("normalizing the zero vector is safe", () => {
  nearVec(Vec3.zero().normalize(), Vec3.zero(), 1e-12);
});

test("lerp interpolates endpoints", () => {
  const a = new Vec3(0, 0, 0);
  const b = new Vec3(10, -4, 2);
  nearVec(a.lerp(b, 0), a, 1e-12, "t=0");
  nearVec(a.lerp(b, 1), b, 1e-12, "t=1");
  nearVec(a.lerp(b, 0.5), new Vec3(5, -2, 1), 1e-12, "t=0.5");
});

test("Mat4.fromRotor transforms points like the rotor itself", () => {
  const r = Rotor.fromAxisAngle(new Vec3(1, -2, 0.5).normalize(), 1.3);
  const m = Mat4.fromRotor(r);
  const v = new Vec3(2, 5, -1);
  nearVec(m.transformPoint(v), r.rotate(v), 1e-9, "matrix vs rotor");
});

test("Mat4 multiplication is associative with the identity", () => {
  const r = Rotor.fromAxisAngle(Vec3.e2(), 0.9);
  const m = Mat4.fromRotor(r);
  const v = new Vec3(1, 1, 1);
  nearVec(
    m.mul(Mat4.identity()).transformPoint(v),
    m.transformPoint(v),
    1e-9,
    "M · I = M",
  );
});

test("perspective projection puts the near plane at NDC z = -1", () => {
  const proj = Mat4.perspective(Math.PI / 2, 1, 1, 100);
  const onNear = proj.transformPoint(new Vec3(0, 0, -1));
  near(onNear.z, -1, 1e-9, "near plane");
});
