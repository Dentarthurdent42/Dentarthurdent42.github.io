import { test } from "node:test";
import { Vec3 } from "../src/math/vec3.js";
import { Bivector } from "../src/ga/bivector.js";
import { near, nearVec } from "./helpers.js";

test("the wedge product is antisymmetric", () => {
  const u = new Vec3(1, 2, 3);
  const v = new Vec3(-2, 0, 1);
  const uv = Bivector.wedge(u, v);
  const vu = Bivector.wedge(v, u);
  near(uv.b23 + vu.b23, 0, 1e-12, "e23");
  near(uv.b31 + vu.b31, 0, 1e-12, "e31");
  near(uv.b12 + vu.b12, 0, 1e-12, "e12");
});

test("a vector wedged with itself vanishes", () => {
  const u = new Vec3(3, -1, 4);
  const uu = Bivector.wedge(u, u);
  near(uu.magnitude(), 0, 1e-12, "u^u");
});

test("wedge magnitude equals the parallelogram area", () => {
  // Two orthogonal unit vectors span a unit-area parallelogram.
  const area = Bivector.wedge(Vec3.e1(), Vec3.e2()).magnitude();
  near(area, 1, 1e-12, "unit area");
});

test("fromAxis and dual are inverse operations", () => {
  const axis = new Vec3(2, -5, 1);
  nearVec(Bivector.fromAxis(axis).dual(), axis, 1e-12, "dual round-trip");
});

test("the wedge product is the dual of the cross product", () => {
  const u = new Vec3(1, 2, -1);
  const v = new Vec3(0, 3, 2);
  nearVec(Bivector.wedge(u, v).dual(), u.cross(v), 1e-12, "wedge vs cross");
});

test("bivector arithmetic behaves linearly", () => {
  const a = new Bivector(1, 2, 3);
  const b = new Bivector(-1, 0, 2);
  const sum = a.add(b);
  near(sum.b23, 0, 1e-12);
  near(sum.b31, 2, 1e-12);
  near(sum.b12, 5, 1e-12);
  near(a.scale(2).sub(a).magnitude(), a.magnitude(), 1e-12, "2a − a = a");
});

test("a normalized bivector has unit magnitude", () => {
  near(new Bivector(3, -4, 12).normalize().magnitude(), 1, 1e-12);
});
