import { test } from "node:test";
import assert from "node:assert/strict";
import { Geometry4 } from "../src/engine/geometry4.js";
import { Object4D } from "../src/engine/object4d.js";
import { Rotor4, Bivector4 } from "../src/ga/rotor4.js";
import { Vec4 } from "../src/math/vec4.js";
import { near } from "./helpers.js";

test("tesseract has 16 vertices and 32 edges of equal length", () => {
  const { vertices, edges } = Geometry4.tesseract(1);
  assert.equal(vertices.length, 16, "16 vertices");
  assert.equal(edges.length, 32, "32 edges");
  for (const [i, j] of edges) {
    near(vertices[i].sub(vertices[j]).length(), 2, 1e-9, "edge length 2·size");
  }
});

test("tesseract edges join vertices differing in exactly one coordinate", () => {
  const { vertices, edges } = Geometry4.tesseract(1);
  for (const [i, j] of edges) {
    const d = vertices[i].sub(vertices[j]);
    const nonzero = [d.x, d.y, d.z, d.w].filter((c) => Math.abs(c) > 1e-9);
    assert.equal(nonzero.length, 1, "exactly one differing coordinate");
  }
});

test("16-cell has 8 vertices and 24 edges, skipping antipodes", () => {
  const { vertices, edges } = Geometry4.cell16(1);
  assert.equal(vertices.length, 8);
  assert.equal(edges.length, 24);
  for (const [i, j] of edges) {
    // No edge connects a vertex to its antipode.
    assert.ok(!vertices[i].equals(vertices[j].negate()), "no antipodal edge");
  }
});

test("5-cell is a regular simplex: 5 vertices, 10 equal edges", () => {
  const { vertices, edges } = Geometry4.cell5(1);
  assert.equal(vertices.length, 5);
  assert.equal(edges.length, 10);
  const len0 = vertices[edges[0][0]].sub(vertices[edges[0][1]]).length();
  for (const [i, j] of edges) {
    near(vertices[i].sub(vertices[j]).length(), len0, 1e-9, "regular edges");
  }
  // The vertices are centred at the origin.
  const centroid = vertices.reduce((a, v) => a.add(v), Vec4.zero()).scale(1 / 5);
  near(centroid.length(), 0, 1e-9, "centred at origin");
});

test("Object4D projects 4D vertices into a 3D line mesh", () => {
  const { vertices, edges } = Geometry4.tesseract(1);
  const obj = new Object4D({ vertices4: vertices, edges });
  assert.equal(obj.mesh.vertices.length, 16, "one projected vertex each");
  assert.equal(obj.mesh.lines.length, 32, "edges become lines");
  assert.equal(obj.mesh.faces.length, 0, "wireframe only");
  assert.equal(obj.mesh.lineColors.length, 32, "a colour per edge");
  for (const v of obj.mesh.vertices) {
    assert.ok(Number.isFinite(v.x + v.y + v.z), "finite projection");
  }
});

test("the w perspective divide pushes +w vertices outward", () => {
  // Two corners sharing x,y,z signs but opposite w should project to
  // different radii: the +w one fans out, the −w one shrinks in.
  const obj = new Object4D({
    vertices4: [new Vec4(1, 1, 1, 1), new Vec4(1, 1, 1, -1)],
    edges: [[0, 1]],
    viewerW: 3.2,
  });
  const near3 = obj.mesh.vertices[0].length(); // +w
  const far3 = obj.mesh.vertices[1].length(); // −w
  assert.ok(near3 > far3, `+w projects larger (${near3} vs ${far3})`);
});

test("updateWorld reprojects after the 4D orientation changes", () => {
  const { vertices, edges } = Geometry4.tesseract(1);
  const obj = new Object4D({ vertices4: vertices, edges });
  const before = obj.mesh.vertices[0].clone();
  obj.rotate4Local(Rotor4.fromPlaneAngle(Bivector4.xw(), 0.6));
  obj.updateWorld();
  const after = obj.mesh.vertices[0];
  assert.ok(before.sub(after).length() > 1e-6, "projection moved after spin");
});
