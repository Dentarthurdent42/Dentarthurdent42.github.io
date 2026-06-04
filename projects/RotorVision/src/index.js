/**
 * RotorVision — a 3D graphics engine that rotates with geometric-algebra
 * rotors instead of quaternions.
 *
 * This barrel re-exports the whole public API. The geometric-algebra core
 * (Vec3, Bivector, Rotor) and the scene types have no DOM dependencies and run
 * anywhere; only Renderer and Engine need a browser canvas.
 */
export { Vec3 } from "./math/vec3.js";
export { Vec4 } from "./math/vec4.js";
export { Mat4 } from "./math/mat4.js";
export { Bivector } from "./ga/bivector.js";
export { Rotor } from "./ga/rotor.js";
export { geometricProduct } from "./ga/cl4.js";
export { Bivector4, Rotor4 } from "./ga/rotor4.js";

export { Mesh } from "./engine/mesh.js";
export { Geometry } from "./engine/geometry.js";
export { Geometry4 } from "./engine/geometry4.js";
export { Object3D } from "./engine/object3d.js";
export { Object4D } from "./engine/object4d.js";
export { Camera } from "./engine/camera.js";
export { Scene } from "./engine/scene.js";
export { Renderer } from "./engine/renderer.js";
export { Engine } from "./engine/engine.js";
