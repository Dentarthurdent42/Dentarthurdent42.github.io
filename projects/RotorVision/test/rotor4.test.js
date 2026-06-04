import { test } from "node:test";
import assert from "node:assert/strict";
import { Vec4 } from "../src/math/vec4.js";
import { Bivector4, Rotor4 } from "../src/ga/rotor4.js";
import { geometricProduct, BLADE } from "../src/ga/cl4.js";
import { near, rng } from "./helpers.js";

const HALF_PI = Math.PI / 2;

function nearVec4(actual, expected, eps = 1e-9, msg = "vec4") {
  near(actual.x, expected.x, eps, `${msg}.x`);
  near(actual.y, expected.y, eps, `${msg}.y`);
  near(actual.z, expected.z, eps, `${msg}.z`);
  near(actual.w, expected.w, eps, `${msg}.w`);
}

test("Cl4 basis products obey the algebra", () => {
  const mv = (i) => {
    const a = new Float64Array(16);
    a[i] = 1;
    return a;
  };
  // e1 e2 = e12
  assert.equal(geometricProduct(mv(BLADE.E1), mv(BLADE.E2))[BLADE.E12], 1);
  // e2 e1 = -e12
  assert.equal(geometricProduct(mv(BLADE.E2), mv(BLADE.E1))[BLADE.E12], -1);
  // e1 e1 = 1 (Euclidean metric)
  assert.equal(geometricProduct(mv(BLADE.E1), mv(BLADE.E1))[BLADE.S], 1);
  // e12 e12 = -1
  assert.equal(geometricProduct(mv(BLADE.E12), mv(BLADE.E12))[BLADE.S], -1);
  // e12 e34 = e1234
  assert.equal(geometricProduct(mv(BLADE.E12), mv(BLADE.E34))[BLADE.E1234], 1);
  // the pseudoscalar squares to +1 in Cl(4,0)
  assert.equal(geometricProduct(mv(BLADE.E1234), mv(BLADE.E1234))[BLADE.S], 1);
});

test("identity rotor leaves a 4D vector unchanged", () => {
  const v = new Vec4(1, -2, 3, 4);
  nearVec4(Rotor4.identity().rotate(v), v);
});

test("simple rotation in e12 turns e1 toward e2 and fixes e3, e4", () => {
  const r = Rotor4.fromPlaneAngle(Bivector4.xy(), HALF_PI);
  nearVec4(r.rotate(Vec4.e1()), Vec4.e2(), 1e-9, "e1→e2");
  nearVec4(r.rotate(Vec4.e3()), Vec4.e3(), 1e-9, "e3 fixed");
  nearVec4(r.rotate(Vec4.e4()), Vec4.e4(), 1e-9, "e4 fixed");
});

test("simple rotation in zw (e34) turns e3 toward e4 and fixes e1, e2", () => {
  const r = Rotor4.fromPlaneAngle(Bivector4.zw(), HALF_PI);
  nearVec4(r.rotate(Vec4.e3()), Vec4.e4(), 1e-9, "e3→e4");
  nearVec4(r.rotate(Vec4.e1()), Vec4.e1(), 1e-9, "e1 fixed");
  nearVec4(r.rotate(Vec4.e2()), Vec4.e2(), 1e-9, "e2 fixed");
});

test("rotation in xw (e14) couples the x and w axes", () => {
  const r = Rotor4.fromPlaneAngle(Bivector4.xw(), HALF_PI);
  nearVec4(r.rotate(Vec4.e1()), Vec4.e4(), 1e-9, "e1→e4");
  nearVec4(r.rotate(Vec4.e4()), Vec4.e1().negate(), 1e-9, "e4→-e1");
});

test("double rotation spins two orthogonal planes at once", () => {
  // A quarter turn in e12 AND e34 simultaneously — the canonical 4D motion.
  const r = Rotor4.doubleRotation(Bivector4.xy(), HALF_PI, Bivector4.zw(), HALF_PI);
  nearVec4(r.rotate(Vec4.e1()), Vec4.e2(), 1e-9, "e1→e2");
  nearVec4(r.rotate(Vec4.e2()), Vec4.e1().negate(), 1e-9, "e2→-e1");
  nearVec4(r.rotate(Vec4.e3()), Vec4.e4(), 1e-9, "e3→e4");
  nearVec4(r.rotate(Vec4.e4()), Vec4.e3().negate(), 1e-9, "e4→-e3");
});

test("an isoclinic double rotation has no fixed direction", () => {
  // Equal angles in two orthogonal planes: every nonzero vector moves.
  const r = Rotor4.doubleRotation(Bivector4.xy(), 0.7, Bivector4.zw(), 0.7);
  const rand = rng(13);
  for (let i = 0; i < 10; i++) {
    const v = new Vec4(rand() - 0.5, rand() - 0.5, rand() - 0.5, rand() - 0.5);
    if (v.lengthSq() < 1e-6) continue;
    const moved = r.rotate(v);
    assert.ok(moved.sub(v).length() > 1e-3, "vector was displaced");
  }
});

test("rotation preserves length in 4D", () => {
  const rand = rng(7);
  // A valid rotor: a product of several simple-plane rotors.
  const r = Rotor4.fromPlaneAngle(Bivector4.xy(), 1.1)
    .mul(Rotor4.fromPlaneAngle(Bivector4.yz(), 0.7))
    .mul(Rotor4.fromPlaneAngle(Bivector4.xw(), -0.5));
  for (let i = 0; i < 10; i++) {
    const v = new Vec4(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1);
    near(r.rotate(v).length(), v.length(), 1e-9, "length preserved");
  }
});

test("fromVectors builds a simple plane that rotation stays within", () => {
  // The plane spanned by e1 and a tilted direction in the yzw subspace.
  const u = Vec4.e1();
  const dir = new Vec4(0, 1, 1, 1).normalize();
  const plane = Bivector4.fromVectors(u, dir);
  assert.ok(plane.isSimple(), "wedge of two vectors is simple");
  const r = Rotor4.fromPlaneAngle(plane, 0.9);
  // A vector orthogonal to the whole plane is fixed by the rotation.
  const fixed = new Vec4(0, 1, -1, 0).normalize(); // ⊥ to both u and dir
  nearVec4(r.rotate(fixed), fixed, 1e-9, "orthogonal direction fixed");
});

test("composed rotors equal sequential rotation", () => {
  const r1 = Rotor4.fromPlaneAngle(Bivector4.yz(), 0.6);
  const r2 = Rotor4.fromPlaneAngle(Bivector4.xw(), 1.1);
  const v = new Vec4(1, 2, -3, 0.5);
  nearVec4(r2.mul(r1).rotate(v), r2.rotate(r1.rotate(v)), 1e-9, "compose");
});

test("reverse undoes the rotation", () => {
  const r = Rotor4.doubleRotation(Bivector4.xy(), 1.3, Bivector4.zw(), -0.8);
  const v = new Vec4(2, -1, 4, 3);
  nearVec4(r.reverse().rotate(r.rotate(v)), v, 1e-9, "reverse");
});

test("the rotation matrix lies in SO(4): orthonormal, det +1", () => {
  const r = Rotor4.doubleRotation(Bivector4.xy(), 0.9, Bivector4.zw(), 0.4);
  const m = r.toMatrix4();
  const col = (i) => new Vec4(m[i * 4], m[i * 4 + 1], m[i * 4 + 2], m[i * 4 + 3]);
  for (let i = 0; i < 4; i++) near(col(i).length(), 1, 1e-9, `|col${i}|`);
  for (let i = 0; i < 4; i++)
    for (let j = i + 1; j < 4; j++)
      near(col(i).dot(col(j)), 0, 1e-9, `col${i}·col${j}`);
  // 4×4 determinant via expansion should be +1 for a proper rotation.
  const det4 = (M) => {
    const e = (r, c) => M[c * 4 + r];
    let d = 0;
    for (let c = 0; c < 4; c++) {
      const sub = [];
      for (let cc = 0; cc < 4; cc++) {
        if (cc === c) continue;
        for (let rr = 1; rr < 4; rr++) sub.push(e(rr, cc));
      }
      const m3 =
        sub[0] * (sub[4] * sub[8] - sub[5] * sub[7]) -
        sub[1] * (sub[3] * sub[8] - sub[5] * sub[6]) +
        sub[2] * (sub[3] * sub[7] - sub[4] * sub[6]);
      d += (c % 2 ? -1 : 1) * e(0, c) * m3;
    }
    return d;
  };
  near(det4(m), 1, 1e-9, "det");
});

test("the pseudoscalar appears when composing rotations in disjoint planes", () => {
  // e12 and e34 share no axis; composing quarter turns produces a grade-4 part.
  const r = Rotor4.doubleRotation(Bivector4.xy(), HALF_PI, Bivector4.zw(), HALF_PI);
  assert.ok(Math.abs(r.b1234) > 0.4, `pseudoscalar present: ${r.b1234}`);
});

test("normalize restores a unit rotor", () => {
  const drifted = new Rotor4(1.01, 0.02, 0, -0.03, 0, 0.01, 0, 0.005);
  near(drifted.normalize().norm(), 1, 1e-12);
});

test("isSimple distinguishes a plane from a double rotation generator", () => {
  assert.ok(Bivector4.xy().isSimple(), "e12 is simple");
  assert.ok(Bivector4.xy().add(Bivector4.zw()).isSimple() === false, "e12+e34 not simple");
});
