export type LoopOptions = {
  /** Called once per frame with the seconds since the last frame (clamped) and the running time in seconds. */
  render: (dt: number, time: number) => void;
  /**
   * `continuous`: render every frame while visible.
   * `on-demand`: render only after `invalidate()` (reduced motion: final state, no animation; BR-001).
   */
  mode?: "continuous" | "on-demand";
  raf?: (cb: FrameRequestCallback) => number;
  caf?: (id: number) => void;
  now?: () => number;
};

/** Longest step passed to the scene, so a resumed tab does not jump. */
export const MAX_DT = 0.1;

/**
 * Frame loop that only runs while it should: visible in the viewport, tab not hidden, not disposed (REQ-012).
 * It owns no GL objects; the scene root wires it to IntersectionObserver and `visibilitychange`.
 */
export class RenderLoop {
  private opts: Required<Omit<LoopOptions, "render">> & Pick<LoopOptions, "render">;
  private id = 0;
  private pending = false;
  private last = 0;
  private time = 0;
  private visible = true;
  private tabHidden = false;
  private disposed = false;
  frames = 0;

  constructor(o: LoopOptions) {
    this.opts = {
      mode: "continuous",
      raf: (cb) => requestAnimationFrame(cb),
      caf: (id) => cancelAnimationFrame(id),
      now: () => performance.now(),
      ...o,
    };
  }

  get mode() {
    return this.opts.mode;
  }

  /** True while a frame is scheduled. */
  get running() {
    return this.pending;
  }

  get active() {
    return !this.disposed && this.visible && !this.tabHidden;
  }

  setVisible(v: boolean) {
    this.visible = v;
    this.sync();
  }

  setTabHidden(h: boolean) {
    this.tabHidden = h;
    this.sync();
  }

  /** Start (continuous) or draw one frame (on-demand). */
  start() {
    this.sync();
  }

  /** Ask for a frame. In continuous mode the loop is already drawing, so this only wakes it if idle. */
  invalidate() {
    if (this.active) this.schedule();
  }

  dispose() {
    this.disposed = true;
    this.cancel();
  }

  private sync() {
    if (!this.active) this.cancel();
    else this.schedule(); // continuous: keep drawing; on-demand: coming back on screen redraws once
  }

  private schedule() {
    if (this.pending || this.disposed) return;
    this.pending = true;
    this.last = this.opts.now();
    this.id = this.opts.raf(this.tick);
  }

  private cancel() {
    if (this.pending) this.opts.caf(this.id);
    this.pending = false;
  }

  private tick = (ts?: number) => {
    this.pending = false;
    if (!this.active) return;
    const t = typeof ts === "number" ? ts : this.opts.now();
    const dt = Math.min(MAX_DT, Math.max(0, (t - this.last) / 1000));
    this.last = t;
    this.time += dt;
    this.frames++;
    this.opts.render(dt, this.time);
    if (this.opts.mode === "continuous" && this.active && !this.disposed) {
      this.pending = true;
      this.id = this.opts.raf(this.tick);
    }
  };
}
