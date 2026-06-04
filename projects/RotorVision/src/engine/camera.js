import { Vec3 } from "../math/vec3.js";
import { Rotor } from "../ga/rotor.js";

/**
 * Camera — a position and a rotor orientation, looking down its own local -z.
 *
 * Notice there is no separate "view matrix": to take a world point into camera
 * space we simply undo the camera's rotor (its reverse) after subtracting the
 * camera position. The reverse of a rotor *is* the inverse rotation, so the
 * view transform is one rotor and one subtraction.
 */
export class Camera {
  constructor(options = {}) {
    this.position = options.position ?? new Vec3(0, 0, 6);
    this.orientation = options.orientation ?? Rotor.identity();
    this.fov = options.fov ?? Math.PI / 3; // vertical field of view
    this.near = options.near ?? 0.1;
    this.far = options.far ?? 200;
  }

  /**
   * Aim the camera at `target`, building its orientation as a rotor.
   *
   * We assemble the camera's orthonormal basis (right, up, backward) and ask
   * `Rotor.fromBasis` for the rotor that carries e1, e2, e3 onto it.
   */
  lookAt(target, up = Vec3.e2()) {
    const backward = this.position.sub(target).normalize(); // camera local +z
    let right = up.cross(backward);
    if (right.lengthSq() < 1e-9) {
      // Looking straight along the up vector; nudge to a stable basis.
      right = Vec3.e1().cross(backward);
    }
    right = right.normalize();
    const trueUp = backward.cross(right).normalize();
    this.orientation = Rotor.fromBasis(right, trueUp, backward);
    return this;
  }

  /**
   * Place the camera on an orbit around `target`.
   *
   * Azimuth and elevation are applied as rotors — a turn in the e3^e1 (ground)
   * plane and then a turn in the e2^e3 (pitch) plane — so even the camera rig
   * is driven by geometric algebra.
   */
  orbit(target, distance, azimuth, elevation) {
    const yaw = Rotor.fromAxisAngle(Vec3.e2(), azimuth);
    // Negative angle so a positive elevation lifts the camera above the scene.
    const pitch = Rotor.fromAxisAngle(Vec3.e1(), -elevation);
    const offset = yaw.mul(pitch).rotate(new Vec3(0, 0, distance));
    this.position = target.add(offset);
    this.lookAt(target);
    return this;
  }

  /** Transform a world-space point into camera space (camera looks down -z). */
  worldToCamera(point) {
    return this.orientation.reverse().rotate(point.sub(this.position));
  }

  /** The direction the camera is looking, in world space. */
  forward() {
    return this.orientation.rotate(new Vec3(0, 0, -1));
  }
}
