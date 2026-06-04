import { Vec3 } from "../math/vec3.js";
import { Object3D } from "./object3d.js";
import { Camera } from "./camera.js";

/**
 * Scene — the renderable world: a root node, a camera, and a light.
 *
 * `update` folds the whole node hierarchy down to world-space transforms; the
 * renderer then just reads each object's `worldPosition` / `worldOrientation`.
 */
export class Scene {
  constructor(options = {}) {
    this.root = new Object3D({ name: "root" });
    this.camera = options.camera ?? new Camera();

    this.background = options.background ?? { top: "#11151f", bottom: "#05070b" };
    this.ambient = options.ambient ?? 0.22;
    this.light = {
      direction: (options.lightDirection ?? new Vec3(-0.5, -1, -0.4)).normalize(),
      intensity: options.lightIntensity ?? 1.0,
      color: options.lightColor ?? { r: 255, g: 246, b: 232 },
    };
  }

  /** Add an Object3D directly under the scene root. */
  add(object) {
    return this.root.add(object);
  }

  /** Refresh every world-space transform in the graph. */
  update() {
    this.root.updateWorld();
  }

  /** All visible, mesh-bearing objects in draw order-agnostic sequence. */
  *renderables() {
    for (const object of this.root.traverse()) {
      if (object.visible && object.mesh) yield object;
    }
  }
}
