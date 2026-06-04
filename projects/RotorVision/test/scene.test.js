import { test } from "node:test";
import { Vec3 } from "../src/math/vec3.js";
import { Rotor } from "../src/ga/rotor.js";
import { Object3D } from "../src/engine/object3d.js";
import { nearVec, nearRotor } from "./helpers.js";

const HALF_PI = Math.PI / 2;

test("a child inherits its parent's rotation", () => {
  const parent = new Object3D({
    orientation: Rotor.fromAxisAngle(Vec3.e2(), HALF_PI),
  });
  const child = parent.add(new Object3D({ position: new Vec3(2, 0, 0) }));
  parent.updateWorld();
  // (2,0,0) turned 90° about +y lands on (0,0,-2).
  nearVec(child.worldPosition, new Vec3(0, 0, -2), 1e-9, "child world pos");
});

test("transforms compose down a three-level hierarchy", () => {
  const orbit = new Object3D({
    orientation: Rotor.fromAxisAngle(Vec3.e2(), HALF_PI),
  });
  const satellite = orbit.add(new Object3D({ position: new Vec3(5, 0, 0) }));
  const moon = satellite.add(new Object3D({ position: new Vec3(1, 0, 0) }));
  orbit.updateWorld();

  nearVec(satellite.worldPosition, new Vec3(0, 0, -5), 1e-9, "satellite");
  nearVec(moon.worldPosition, new Vec3(0, 0, -6), 1e-9, "moon");
});

test("world orientation is the product of local rotors", () => {
  const a = Rotor.fromAxisAngle(Vec3.e1(), 0.4);
  const b = Rotor.fromAxisAngle(Vec3.e3(), 1.1);
  const parent = new Object3D({ orientation: a });
  const child = parent.add(new Object3D({ orientation: b }));
  parent.updateWorld();
  nearRotor(child.worldOrientation, a.mul(b), 1e-9);
});

test("uniform scale propagates through the hierarchy", () => {
  const parent = new Object3D({ scale: 2 });
  const child = parent.add(
    new Object3D({ scale: 3, position: new Vec3(1, 0, 0) }),
  );
  parent.updateWorld();
  // Child sits at parentScale · localPosition = 2 · (1,0,0).
  nearVec(child.worldPosition, new Vec3(2, 0, 0), 1e-9, "scaled position");
  // A local vertex is scaled by the combined factor 2 · 3.
  nearVec(
    child.localToWorld(new Vec3(1, 0, 0)),
    new Vec3(2 + 6, 0, 0),
    1e-9,
    "scaled vertex",
  );
});

test("rotateLocal and rotateBy compose on the correct side", () => {
  const spin = Rotor.fromAxisAngle(Vec3.e2(), 0.3);
  const base = Rotor.fromAxisAngle(Vec3.e1(), 1.0);

  const local = new Object3D({ orientation: base.clone() });
  local.rotateLocal(spin);
  nearRotor(local.orientation, base.mul(spin), 1e-9, "rotateLocal");

  const world = new Object3D({ orientation: base.clone() });
  world.rotateBy(spin);
  nearRotor(world.orientation, spin.mul(base), 1e-9, "rotateBy");
});
