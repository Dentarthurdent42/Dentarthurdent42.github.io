/**
 * Cl4 — the low-level engine of the 4D geometric algebra Cl(4,0).
 *
 * Everything in 4D geometric algebra reduces to one operation: the geometric
 * product of basis blades. We represent a blade by a 4-bit mask over the
 * orthonormal basis {e1: bit 0, e2: bit 1, e3: bit 2, e4: bit 3}, so a full
 * multivector is just 16 coefficients (one per subset of {e1,e2,e3,e4}).
 *
 * The product of two blades is another blade — their symmetric difference,
 * since shared factors square to +1 in a Euclidean metric and drop out — times
 * a sign that counts how many transpositions sort the concatenated factors.
 * Rotor4 is built entirely on top of `geometricProduct`.
 */

const SIZE = 16; // 2^4 basis blades

function popcount(x) {
  let c = 0;
  while (x) {
    c += x & 1;
    x >>= 1;
  }
  return c;
}

/**
 * The sign produced by sorting the concatenation of blade `a` then blade `b`
 * into canonical order (e1 < e2 < e3 < e4). For each factor of `a` we count
 * how many factors of `b` it must hop over; an odd total flips the sign.
 * Shared factors annihilate to +1 (Euclidean), so the metric contributes no
 * extra sign.
 */
function reorderSign(a, b) {
  let shifted = a >> 1;
  let swaps = 0;
  while (shifted) {
    swaps += popcount(shifted & b);
    shifted >>= 1;
  }
  return swaps & 1 ? -1 : 1;
}

// Precompute the sign of every basis-blade product once.
const SIGN = new Int8Array(SIZE * SIZE);
for (let a = 0; a < SIZE; a++) {
  for (let b = 0; b < SIZE; b++) {
    SIGN[a * SIZE + b] = reorderSign(a, b);
  }
}

/**
 * The geometric product of two full multivectors (length-16 arrays). The
 * result blade for a pair is `a ^ b`; accumulate each contribution with its
 * precomputed sign.
 */
export function geometricProduct(A, B) {
  const C = new Float64Array(SIZE);
  for (let a = 0; a < SIZE; a++) {
    const av = A[a];
    if (av === 0) continue;
    const row = a * SIZE;
    for (let b = 0; b < SIZE; b++) {
      const bv = B[b];
      if (bv === 0) continue;
      C[a ^ b] += SIGN[row + b] * av * bv;
    }
  }
  return C;
}

// Blade indices, named for readability elsewhere in the package.
export const BLADE = {
  S: 0b0000, // scalar
  E1: 0b0001,
  E2: 0b0010,
  E3: 0b0100,
  E4: 0b1000,
  E12: 0b0011,
  E13: 0b0101,
  E14: 0b1001,
  E23: 0b0110,
  E24: 0b1010,
  E34: 0b1100,
  E1234: 0b1111, // pseudoscalar
};

export { SIZE as BLADE_COUNT };
