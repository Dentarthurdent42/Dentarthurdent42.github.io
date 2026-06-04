import assert from "node:assert/strict";

/** Assert two numbers are equal within a tolerance. */
export function near(actual, expected, eps = 1e-9, message = "") {
  assert.ok(
    Math.abs(actual - expected) < eps,
    `${message} expected ${expected}, got ${actual} (|Δ| = ${Math.abs(
      actual - expected,
    )})`,
  );
}

/** Assert two Vec3 are equal within a tolerance. */
export function nearVec(actual, expected, eps = 1e-9, message = "vec") {
  near(actual.x, expected.x, eps, `${message}.x`);
  near(actual.y, expected.y, eps, `${message}.y`);
  near(actual.z, expected.z, eps, `${message}.z`);
}

/** Assert two rotors describe the same rotation (accounting for ±R). */
export function nearRotor(actual, expected, eps = 1e-7, message = "rotor") {
  const sameSign =
    Math.abs(actual.a - expected.a) +
      Math.abs(actual.b23 - expected.b23) +
      Math.abs(actual.b31 - expected.b31) +
      Math.abs(actual.b12 - expected.b12) <
    eps;
  const flipped =
    Math.abs(actual.a + expected.a) +
      Math.abs(actual.b23 + expected.b23) +
      Math.abs(actual.b31 + expected.b31) +
      Math.abs(actual.b12 + expected.b12) <
    eps;
  assert.ok(
    sameSign || flipped,
    `${message}: ${actual.toString()} is not ${expected.toString()}`,
  );
}

/** A small deterministic pseudo-random generator for reproducible tests. */
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}
