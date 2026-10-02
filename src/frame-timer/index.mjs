// <frame-timer fps="30">: a clock you can put in the page. While playing,
// it fires `tick` at a steady rate, paced by requestAnimationFrame (so it
// rests while the page is hidden). Controlled like a media element:
// play(), pause(), `paused`, and play/pause events. See readme.md.

/**
 * A frame-paced clock: fires `tick` at a steady rate while playing, with
 * a media-element-style API.
 *
 * @tag frame-timer
 * @summary A frame-paced ticking clock with play/pause.
 *
 * @attr {number} fps - Ticks per second. Default 60. Any positive number up to the display's refresh rate.
 * @attr {boolean} paused - Whether the timer is paused. Reflects; write it in markup to start paused.
 *
 * @fires tick - Once per period while playing. Read `ticks` for the count.
 * @fires play - The timer started (or resumed).
 * @fires pause - The timer paused.
 *
 * Invoker commands: `--play`, `--pause`, and `--toggle`
 * (`<button commandfor="clock" command="--toggle">`).
 */
export default class FrameTimer extends HTMLElement {
  static observedAttributes = ["paused", "fps"];

  #frame = 0;

  constructor() {
    super();
    this.addEventListener("command", (event) => {
      if (event.command === "--play") this.play();
      else if (event.command === "--pause") this.pause();
      else if (event.command === "--toggle") this.paused ? this.play() : this.pause();
    });
  }

  #next = 0;
  #ticks = 0;
  #reflecting = false;
  #ready = false;

  connectedCallback() {
    this.#ready = true;
    if (!this.paused) this.#start();
  }

  disconnectedCallback() {
    this.#stop();
  }

  attributeChangedCallback(name, previous, current) {
    // Markup attributes (seen before the first connect) set the initial
    // state silently, like a media element's.
    if (this.#reflecting || !this.#ready) return;
    if (name === "paused") {
      // The attribute already changed, so compare against its old value.
      if (current === null && previous !== null) {
        if (this.isConnected) this.#start();
        this.dispatchEvent(new Event("play", { bubbles: true }));
      } else if (current !== null && previous === null) {
        this.#stop();
        this.dispatchEvent(new Event("pause", { bubbles: true }));
      }
    } else if (name === "fps") {
      this.#next = 0; // re-anchor the schedule to the new rate
    }
  }

  /**
   * Ticks per second.
   * @type {number}
   */
  get fps() {
    const fps = Number(this.getAttribute("fps") ?? 60);
    return fps > 0 ? fps : 60;
  }
  set fps(value) {
    this.setAttribute("fps", String(value));
  }

  /**
   * Whether the timer is paused.
   * @type {boolean}
   * @readonly
   */
  get paused() {
    return this.hasAttribute("paused");
  }

  /**
   * Ticks fired since the element was created (pausing keeps the count).
   * @type {number}
   */
  get ticks() {
    return this.#ticks;
  }
  set ticks(value) {
    this.#ticks = Math.max(0, Math.trunc(Number(value) || 0));
  }

  /** Start or resume ticking. */
  play() {
    const wasPaused = this.paused;
    this.#setPaused(false);
    if (this.isConnected) this.#start();
    if (wasPaused) this.dispatchEvent(new Event("play", { bubbles: true }));
  }

  /** Stop ticking (the count is kept). */
  pause() {
    const wasPaused = this.paused;
    this.#setPaused(true);
    this.#stop();
    if (!wasPaused) this.dispatchEvent(new Event("pause", { bubbles: true }));
  }

  #setPaused(paused) {
    this.#reflecting = true;
    this.toggleAttribute("paused", paused);
    this.#reflecting = false;
  }

  #start() {
    if (this.#frame) return; // never two loops
    this.#next = 0;
    const loop = (now) => {
      const period = 1000 / this.fps;
      if (!this.#next) this.#next = now + period;
      // Fire when the next tick is due (within half a 60Hz frame). If the
      // page fell far behind (e.g. it was hidden), skip the backlog rather
      // than firing a burst.
      if (now >= this.#next - 8) {
        this.#next = now - this.#next > period ? now + period : this.#next + period;
        this.#ticks++;
        this.dispatchEvent(new Event("tick", { bubbles: true }));
      }
      if (this.#frame) this.#frame = requestAnimationFrame(loop);
    };
    this.#frame = requestAnimationFrame(loop);
  }

  #stop() {
    cancelAnimationFrame(this.#frame);
    this.#frame = 0;
  }
}
