import { test } from "node:test";
import assert from "node:assert/strict";
import { Geometry } from "../src/engine/geometry.js";
import { near } from "./helpers.js";

/**
 * The signed volume of a closed triangle mesh, via the divergence theorem.
 * A positive result means every face winds counter-clockwise as seen from
 * outside — exactly the convention the renderer's back-face culling needs.
 */
function signedVolume(mesh) {
  let vol = 0;
  for (const [i, j, k] of mesh.faces) {
    const a = mesh.vertices[i];
    const b = mesh.vertices[j];
    const c = mesh.vertices[k];
    vol += a.dot(b.cross(c));
  }
  return vol / 6;
}

test("box has the expected vertex and face counts", () => {
  const box = Geometry.box(1, 1, 1);
  assert.equal(box.vertices.length, 8, "8 vertices");
  assert.equal(box.faces.length, 12, "12 triangles");
});

test("box faces wind outward and enclose the right volume", () => {
  const vol = signedVolume(Geometry.box(2, 3, 4));
  near(vol, 24, 1e-9, "box volume = 2·3·4");
});

test("octahedron faces wind outward", () => {
  const octa = Geometry.octahedron(1);
  assert.equal(octa.vertices.length, 6);
  assert.equal(octa.faces.length, 8);
  near(signedVolume(octa), 4 / 3, 1e-9, "octahedron volume");
});

test("sphere faces wind outward and approximate the analytic volume", () => {
  const vol = signedVolume(Geometry.sphere(1, 48, 32));
  const exact = (4 / 3) * Math.PI;
  assert.ok(vol > 0, "outward winding");
  assert.ok(Math.abs(vol - exact) / exact < 0.02, `sphere volume ${vol}`);
});

test("torus faces wind outward and approximate the analytic volume", () => {
  const R = 1.2;
  const r = 0.4;
  const vol = signedVolume(Geometry.torus(R, r, 64, 32));
  const exact = 2 * Math.PI * Math.PI * R * r * r;
  assert.ok(vol > 0, "outward winding");
  assert.ok(Math.abs(vol - exact) / exact < 0.02, `torus volume ${vol}`);
});

test("torus knot builds a closed, outward-wound tube", () => {
  const knot = Geometry.torusKnot(1, 0.3, 120, 12, 2, 3);
  assert.ok(knot.vertices.length > 0, "has vertices");
  assert.ok(knot.faces.length > 0, "has faces");
  assert.ok(signedVolume(knot) > 0, "outward winding");
  for (const v of knot.vertices) {
    assert.ok(Number.isFinite(v.x + v.y + v.z), "no NaN vertices");
  }
});

test("torus knot closes smoothly with no holonomy twist at the seam", () => {
  // Each tube cross-section meets its neighbour with edges of comparable
  // length. If parallel transport's holonomy isn't compensated for, the seam
  // (where the last sample wraps to the first) connects each vertex j to the
  // diametrically-opposite vertex on the other ring, blowing those edges up.
  const N = 120;
  const T = 12;
  const knot = Geometry.torusKnot(1, 0.3, N, T, 2, 3);
  const edge = (i, j, ii, jj) =>
    knot.vertices[i * T + j].distanceTo(knot.vertices[ii * T + jj]);

  let inner = 0;
  for (let i = 0; i < N - 1; i++)
    for (let j = 0; j < T; j++) inner += edge(i, j, i + 1, j);
  inner /= (N - 1) * T;

  let seam = 0;
  for (let j = 0; j < T; j++) seam += edge(N - 1, j, 0, j);
  seam /= T;

  assert.ok(
    seam < inner * 1.5,
    `seam edges (avg ${seam.toFixed(4)}) much longer than inner edges (avg ${inner.toFixed(4)})`,
  );
});

test("grid is line geometry with no triangles", () => {
  const div = 5;
  const grid = Geometry.grid(10, div);
  assert.equal(grid.faces.length, 0, "no faces");
  // (divisions + 1) rows/columns × divisions short segments × two directions.
  assert.equal(grid.lines.length, 2 * (div + 1) * div, "short segment count");
  // Every segment connects adjacent lattice points one step apart.
  const step = 10 / div;
  for (const [i, j] of grid.lines) {
    const d = grid.vertices[i].distanceTo(grid.vertices[j]);
    assert.ok(Math.abs(d - step) < 1e-9, `short segment length ${d}`);
  }
});
