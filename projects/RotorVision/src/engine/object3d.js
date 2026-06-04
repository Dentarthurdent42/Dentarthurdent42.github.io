import { Vec3 } from "../math/vec3.js";
import { Rotor } from "../ga/rotor.js";

/**
 * Object3D — a node in the scene graph.
 *
 * Its local transform is a translation, a *rotor* and a uniform scale. Because
 * rotors compose by plain multiplication and a uniform scale commutes with
 * rotation, a whole hierarchy of these nodes collapses into one world-space
 * (position, rotor, scale) with no matrices anywhere — see `updateWorld`.
 *
 * Scale is deliberately uniform: a non-uniform scale does not commute with
 * rotation, so it could not be folded into a single clean rotor transform.
 * Non-uniform *shapes* are made by generating the geometry at the wanted size.
 */
export class Object3D {
  constructor(options = {}) {
    this.name = options.name ?? "object";
    this.mesh = options.mesh ?? null;
    this.material = {
      color: { r: 200, g: 200, b: 210 },
      wireframe: false,
      doubleSided: false,
      // Painter's pass layer. Lower-renderOrder primitives are drawn first,
      // regardless of their depth; within a layer the usual back-to-front
      // depth sort still applies. The escape hatch when two primitives have
      // overlapping depth ranges yet a clear logical front/back relationship
      // (a floor sits behind every object, a HUD overlay sits in front).
      renderOrder: 0,
      ...options.material,
    };

    // Local transform.
    this.position = options.position ?? Vec3.zero();
    this.orientation = options.orientation ?? Rotor.identity();
    this.scale = options.scale ?? 1;
    this.visible = options.visible ?? true;

    // World transform, refreshed by updateWorld each frame.
    this.worldPosition = this.position.clone();
    this.worldOrientation = this.orientation.clone();
    this.worldScale = this.scale;

    this.children = [];
    this.parent = null;
  }

  add(child) {
    child.parent = this;
    this.children.push(child);
    return child;
  }

  /** Pre-compose a rotor in the parent frame (orbit-style rotation). */
  rotateBy(rotor) {
    this.orientation = rotor.mul(this.orientation).normalize();
    return this;
  }

  /** Post-compose a rotor in the object's own frame (spin in place). */
  rotateLocal(rotor) {
    this.orientation = this.orientation.mul(rotor).normalize();
    return this;
  }

  /**
   * Fold this node and all of its descendants down to world-space transforms.
   *
   * The parent contributes a (position, orientation, scale); this is the
   * derivation of T_parent ∘ T_local, exact precisely because the scale is
   * uniform and therefore commutes through the rotor.
   */
  updateWorld(
    parentPosition = Vec3.zero(),
    parentOrientation = Rotor.identity(),
    parentScale = 1,
  ) {
    this.worldOrientation = parentOrientation.mul(this.orientation);
    this.worldScale = parentScale * this.scale;
    this.worldPosition = parentPosition.add(
      parentOrientation.rotate(this.position.scale(parentScale)),
    );
    for (const child of this.children) {
      child.updateWorld(
        this.worldPosition,
        this.worldOrientation,
        this.worldScale,
      );
    }
  }

  /** Map one of this object's local vertices into world space. */
  localToWorld(vertex) {
    return this.worldPosition.add(
      this.worldOrientation.rotate(vertex.scale(this.worldScale)),
    );
  }

  /** Depth-first walk over this subtree. */
  *traverse() {
    yield this;
    for (const child of this.children) {
      yield* child.traverse();
    }
  }
}
