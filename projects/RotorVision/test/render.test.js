import { test } from "node:test";
import assert from "node:assert/strict";
import { Vec3 } from "../src/math/vec3.js";
import { Camera } from "../src/engine/camera.js";
import { Scene } from "../src/engine/scene.js";
import { Object3D } from "../src/engine/object3d.js";
import { Geometry } from "../src/engine/geometry.js";
import { Mesh } from "../src/engine/mesh.js";
import { Engine } from "../src/engine/engine.js";

/**
 * The renderer needs a browser canvas, so these tests drive it through a
 * minimal mock 2D context that just tallies the drawing calls. That is enough
 * to exercise the whole projection / culling / painter's-sort pipeline
 * headlessly.
 */
function mockContext() {
  const calls = { fill: 0, stroke: 0, fillRect: 0 };
  const sequence = []; // ordered record of fill/stroke calls + their colour
  const ctx = {
    calls,
    sequence,
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    setTransform() {},
    createLinearGradient() {
      return { addColorStop() {} };
    },
    fillRect() {
      calls.fillRect++;
    },
    beginPath() {},
    closePath() {},
    moveTo() {},
    lineTo() {},
    fill() {
      calls.fill++;
      sequence.push({ op: "fill", style: ctx.fillStyle });
    },
    stroke() {
      calls.stroke++;
      sequence.push({ op: "stroke", style: ctx.strokeStyle });
    },
  };
  return ctx;
}

function mockCanvas(width = 800, height = 600) {
  const ctx = mockContext();
  return {
    ctx,
    clientWidth: width,
    clientHeight: height,
    width,
    height,
    getContext() {
      return ctx;
    },
  };
}

function withWindow(fn) {
  const had = "window" in globalThis;
  const prev = globalThis.window;
  globalThis.window = { devicePixelRatio: 1 };
  try {
    return fn();
  } finally {
    if (had) globalThis.window = prev;
    else delete globalThis.window;
  }
}

function makeScene() {
  const camera = new Camera({ position: new Vec3(6, 5, 8) });
  camera.lookAt(Vec3.zero());
  const scene = new Scene({ camera });
  scene.add(new Object3D({ mesh: Geometry.box(2, 2, 2) }));
  return scene;
}

test("renderer culls back faces and draws the visible ones", () => {
  withWindow(() => {
    const canvas = mockCanvas();
    const engine = new Engine(canvas, { scene: makeScene() });
    engine.step(0);

    const { stats } = engine.renderer;
    assert.equal(stats.faces, 12, "a cube submits 12 triangles");
    assert.ok(stats.drawn > 0, "some faces survive culling");
    assert.ok(stats.drawn < 12, "back faces are culled");
    assert.equal(
      canvas.ctx.calls.fill,
      stats.drawn,
      "one fill per drawn triangle",
    );
    assert.ok(canvas.ctx.calls.fillRect > 0, "background was painted");
  });
});

test("wireframe mode strokes instead of filling", () => {
  withWindow(() => {
    const canvas = mockCanvas();
    const engine = new Engine(canvas, { scene: makeScene() });
    engine.renderer.mode = "wireframe";
    engine.step(0);
    assert.equal(canvas.ctx.calls.fill, 0, "no fills in wireframe mode");
    assert.ok(canvas.ctx.calls.stroke > 0, "edges are stroked");
  });
});

test("an empty scene still paints the background without error", () => {
  withWindow(() => {
    const canvas = mockCanvas();
    const scene = new Scene({ camera: new Camera() });
    const engine = new Engine(canvas, { scene });
    engine.step(0);
    assert.equal(engine.renderer.stats.drawn, 0, "nothing to draw");
    assert.ok(canvas.ctx.calls.fillRect > 0, "background still painted");
  });
});

test("lines that straddle the near plane are clipped, not dropped", () => {
  withWindow(() => {
    const canvas = mockCanvas();
    const camera = new Camera({ position: new Vec3(0, 0, 0), near: 0.1 });
    const scene = new Scene({ camera });
    // One endpoint sits behind the camera, the other well in front. The
    // segment crosses the near plane and should still render its visible part.
    const mesh = new Mesh([new Vec3(0, 0, 5), new Vec3(0, 0, -10)], [], [[0, 1]]);
    scene.add(new Object3D({ mesh, material: { color: { r: 200, g: 200, b: 200 } } }));
    const engine = new Engine(canvas, { scene });
    engine.step(0);
    assert.ok(
      canvas.ctx.calls.stroke > 0,
      "the segment's visible portion was drawn",
    );
  });
});

test("lines wholly behind the camera are dropped", () => {
  withWindow(() => {
    const canvas = mockCanvas();
    const camera = new Camera({ position: new Vec3(0, 0, 0), near: 0.1 });
    const scene = new Scene({ camera });
    const mesh = new Mesh([new Vec3(0, 0, 5), new Vec3(0, 0, 8)], [], [[0, 1]]);
    scene.add(new Object3D({ mesh, material: { color: { r: 200, g: 200, b: 200 } } }));
    const engine = new Engine(canvas, { scene });
    engine.step(0);
    assert.equal(canvas.ctx.calls.stroke, 0, "behind-camera line not drawn");
  });
});

test("a lower renderOrder draws first even when its depth would sort later", () => {
  withWindow(() => {
    const canvas = mockCanvas();
    // Place a triangle behind the camera focus, so it would normally draw
    // last; the line, though far closer to the camera, is given a lower
    // renderOrder so it must still be drawn *before* the triangle.
    const camera = new Camera({ position: new Vec3(0, 0, 10), near: 0.1 });
    const scene = new Scene({ camera });

    const triMesh = new Mesh(
      [new Vec3(-1, -1, 0), new Vec3(1, -1, 0), new Vec3(0, 1, 0)],
      [[0, 1, 2]],
      [],
    );
    scene.add(
      new Object3D({ mesh: triMesh, material: { color: { r: 200, g: 0, b: 0 } } }),
    );

    const lineMesh = new Mesh(
      [new Vec3(-0.5, 0, 5), new Vec3(0.5, 0, 5)],
      [],
      [[0, 1]],
    );
    scene.add(
      new Object3D({
        mesh: lineMesh,
        material: { color: { r: 0, g: 0, b: 200 }, renderOrder: -1 },
      }),
    );

    const engine = new Engine(canvas, { scene });
    engine.step(0);

    const seq = canvas.ctx.sequence;
    const firstStroke = seq.findIndex((s) => s.op === "stroke");
    const firstFill = seq.findIndex((s) => s.op === "fill");
    assert.ok(firstStroke >= 0 && firstFill >= 0, "both primitives drew");
    assert.ok(
      firstStroke < firstFill,
      `renderOrder layered the line first (stroke at ${firstStroke}, fill at ${firstFill})`,
    );
  });
});

test("engine.step advances time and frame count", () => {
  withWindow(() => {
    const engine = new Engine(mockCanvas(), { scene: makeScene() });
    engine.step(0.5);
    engine.step(0.5);
    assert.equal(engine.frame, 2, "two frames stepped");
    assert.ok(Math.abs(engine.time - 1) < 1e-9, "time accumulated");
  });
});
