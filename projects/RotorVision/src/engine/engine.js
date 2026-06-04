import { Renderer } from "./renderer.js";
import { Scene } from "./scene.js";

/**
 * Engine — the run loop. Owns a Renderer and a Scene, drives a
 * requestAnimationFrame loop, and hands each frame's delta time to a
 * user-supplied update callback (where rotors get spun).
 */
export class Engine {
  constructor(canvas, options = {}) {
    this.renderer = new Renderer(canvas, options);
    this.scene = options.scene ?? new Scene();
    this._update = options.update ?? (() => {});
    this.running = false;
    this.time = 0;
    this.frame = 0;
    this.fps = 0;
    this._last = 0;
    this._loop = this._loop.bind(this);
  }

  /** Register the per-frame callback: `(deltaSeconds, totalSeconds) => void`. */
  onUpdate(fn) {
    this._update = fn;
    return this;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._last = performance.now();
    requestAnimationFrame(this._loop);
  }

  stop() {
    this.running = false;
  }

  toggle() {
    this.running ? this.stop() : this.start();
  }

  /** Advance and draw exactly one frame (useful while paused). */
  step(dt = 1 / 60) {
    this.time += dt;
    this.frame++;
    this._update(dt, this.time);
    this.renderer.render(this.scene);
  }

  _loop(now) {
    if (!this.running) return;
    let dt = (now - this._last) / 1000;
    this._last = now;
    dt = Math.min(dt, 0.05); // clamp huge stalls (e.g. tab was hidden)

    this.time += dt;
    this.frame++;
    this.fps += (1 / Math.max(dt, 1e-4) - this.fps) * 0.1;

    this._update(dt, this.time);
    this.renderer.render(this.scene);

    requestAnimationFrame(this._loop);
  }
}
