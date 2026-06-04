# RotorVision

A small graphics engine that rotates with **geometric-algebra rotors** instead
of quaternions — in **3D *and* 4D**.

Everything that turns in RotorVision — meshes, the scene-graph hierarchy, the
camera rig, even the swept geometry of the torus knot — is rotated by a rotor
through the sandwich product **v′ = R v R~**. There is not a single quaternion
or rotation matrix in the transform path.

And because that one formula is dimension-agnostic, the very same idea drives a
tumbling **tesseract**: a 4D rotor spinning in two orthogonal planes at once, a
motion a quaternion simply cannot express. That is the payoff of rotors over
quaternions — see [4D rotations](#4d-rotations).

## Why rotors?

A **rotor** is an even-grade element of the 3D geometric algebra G3 — a scalar
plus a bivector:

```
R = a + b23·e23 + b31·e31 + b12·e12
```

It carries the same four numbers as a unit quaternion and costs exactly the
same to evaluate, but it is built from honest geometric objects rather than
abstract symbols:

| Quaternion | Rotor |
| --- | --- |
| `i, j, k` are abstract units *asserted* to square to -1 | `e23, e31, e12` are oriented **planes**; squaring to -1 is *derived* from the geometric product |
| Rotates by embedding a vector as a "pure quaternion" in 4D | Rotates a vector that lives in the *same algebra* — no embedding |
| A rotation is "about an axis" (a 3D-only accident) | A rotation is "in a plane" — the picture works in any dimension |
| `q v q*` | `R v R~` |

A rotor is constructed by exponentiating a bivector, and composing rotations is
just multiplying rotors. See `src/ga/rotor.js` for the fully commented
implementation, including the expanded sandwich product.

## 4D rotations

In 3D a rotor and a quaternion carry the same four numbers, so the case for
rotors is mostly conceptual. In 4D the difference becomes concrete: **a
quaternion cannot rotate a 4D vector at all**, while the rotor's sandwich
product `v' = R v R~` works without changing a thing.

Four-dimensional rotation is also genuinely richer. 3D has three planes of
rotation; 4D has **six** (one per pair of axes: xy, xz, xw, yz, yw, zw). A 4D
rotor therefore has eight components — a scalar, the six bivector planes, and a
grade-4 *pseudoscalar* that 3D never needed:

```
R = s + (b12 e12 + b13 e13 + b14 e14 + b23 e23 + b24 e24 + b34 e34) + b1234 e1234
```

The headline motion is the **double rotation**: spinning in two completely
orthogonal planes (say xy and zw) at the same time. It has no axis, no 3D
analogue, and is exactly what makes a projected tesseract appear to turn itself
inside out. The demo's centerpiece is one such double rotation; press **Shape**
to cycle through the tesseract, the 16-cell, and the 5-cell.

```js
import { Rotor4, Bivector4, Vec4 } from "./src/index.js";

// A simple rotation, one plane — the 4D twin of the 3D constructor.
const R = Rotor4.fromPlaneAngle(Bivector4.xy(), Math.PI / 2);
R.rotate(new Vec4(1, 0, 0, 0));          // → Vec4(0, 1, 0, 0)

// A double rotation: two orthogonal planes at once. No quaternion does this.
const D = Rotor4.doubleRotation(Bivector4.xy(), 0.5, Bivector4.zw(), 0.3);

// Rotate in any tilted plane by spanning it with two vectors (always simple).
const plane = Bivector4.fromVectors(Vec4.e1(), new Vec4(0, 1, 1, 1));
Rotor4.fromPlaneAngle(plane, 0.4);
```

Under the hood, `src/ga/cl4.js` implements the geometric product of the full
16-component Clifford algebra Cl(4,0) from a one-line blade rule; `Rotor4` is
built on top of it, and `Object4D` projects a 4D wireframe down to 3D (a
perspective divide along w) so the rest of the pipeline can draw it.

## Running the demo

The demo is a set of native ES modules, so it needs to be served over HTTP:

```bash
npm start          # serves the folder at http://localhost:8000
```

Then open <http://localhost:8000>. You will see a rotor-spun torus knot, five
satellites orbiting a shared parent node, and a moon nested one level deeper —
the whole hierarchy resolved with rotor multiplication. Drag to orbit the
camera, scroll to zoom, and watch the HUD report the knot's live rotor.

## Running the tests

The geometric-algebra core has no browser dependencies and is covered by a
suite that runs on Node's built-in test runner:

```bash
npm test
```

It checks the 3D rotor algebra (sandwich product, composition, `exp`/`log`,
slerp, the double cover), the 4D rotor algebra (Cl(4,0) products, simple and
double rotations, the SO(4) matrix, the pseudoscalar), mesh and polytope
geometry, the scene-graph transforms, and the renderer pipeline through a
headless mock canvas.

## How it works

```
src/
  math/
    vec3.js        Grade-1 vectors — the things rotors act on
    vec4.js        4D vectors — the things 4D rotors act on
    mat4.js        4×4 matrix, only for perspective + WebGL interop
  ga/
    bivector.js    3D grade-2 oriented planes; the wedge product
    rotor.js       The 3D rotation primitive: sandwich product, exp/log, slerp
    cl4.js         The full Cl(4,0) geometric product, from a one-line blade rule
    rotor4.js      The 4D rotation primitive: six planes, double rotations
  engine/
    geometry.js    Procedural meshes (the torus knot sweeps its tube with rotors)
    geometry4.js   4D polytopes: tesseract, 16-cell, 5-cell
    mesh.js        Raw vertex/face/line data
    object3d.js    Scene-graph node with a (position, rotor, scale) transform
    object4d.js    A 4D wireframe that projects to 3D each frame
    camera.js      A position + a rotor; the view transform is the reverse rotor
    scene.js       Root node, camera and light
    renderer.js    Software rasteriser on a 2D canvas (painter's algorithm)
    engine.js      The requestAnimationFrame run loop
  index.js         Barrel re-export of the public API
  demo.js          The showcase scene
```

The pipeline is deliberately matrix-free apart from the final perspective
divide: vertices are placed in the world by rotors (`Object3D`), carried into
camera space by the camera's reverse rotor (`Camera`), and only then projected.

## API sketch

```js
import { Rotor, Vec3, Bivector } from "./src/index.js";

// Rotate a vector 90° in the e1^e2 plane.
const R = Rotor.fromPlaneAngle(new Bivector(0, 0, 1), Math.PI / 2);
R.rotate(new Vec3(1, 0, 0));            // → Vec3(0, 1, 0)

// The shortest rotation taking one direction onto another — no trig, no axis.
Rotor.fromTo(Vec3.e1(), Vec3.e3());

// Compose rotations by multiplying; interpolate them by slerp.
const A = Rotor.fromAxisAngle(Vec3.e2(), 0.5);
const B = Rotor.fromAxisAngle(Vec3.e1(), 1.2);
A.mul(B);                                // apply B, then A
A.slerp(B, 0.5);                         // halfway between the two

// Hand the rotation to a matrix-based pipeline (e.g. WebGL) when you need to.
Rotor.fromAxisAngle(Vec3.e2(), 1.0).toMatrix3();
```

## License

MIT
