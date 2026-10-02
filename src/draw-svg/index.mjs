// <draw-svg>: "self-drawing" SVG. Wrap an <svg>, and its strokes draw
// themselves in. Each shape gets pathLength="1" so one set of numbers fits
// every shape, and its stroke-dashoffset is animated with the Web
// Animations API: no generated <style>, no inline code, CSP-safe. Without
// JavaScript (or with reduced motion), the SVG is simply shown, drawn.
// Controlled like a media element: play(), pause(), `paused`, and
// play/pause/ended events. See readme.md.

const SHAPES = "path, line, polyline, polygon, circle, ellipse, rect";
const reducedMotion = () => globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

// "2s", "250ms", or a bare number of milliseconds.
const time = (text, fallback) => {
  const match = /^\s*(-?\d*\.?\d+)\s*(ms|s)?\s*$/i.exec(text ?? "");
  if (!match) return fallback;
  return Number(match[1]) * (match[2]?.toLowerCase() === "s" ? 1000 : 1);
};

/**
 * Animates the strokes of the SVG inside it so they draw themselves in,
 * with a media-element-style API.
 *
 * @tag draw-svg
 * @summary Self-drawing SVG strokes, CSP-safe and reduced-motion aware.
 *
 * @attr {string} duration - How long each shape takes to draw: `2s`, `400ms`, or milliseconds. Default `2s`.
 * @attr {string} delay - Wait before the first shape starts. Default `0`.
 * @attr {string} stagger - Extra delay for each next shape, so they draw one after another. Default `0` (together).
 * @attr {string} easing - A CSS easing function. Default `ease-in-out`.
 * @attr {string} iterations - How many times to draw: a number or `infinite`. Default `1`.
 * @attr {string} direction - `normal`, `reverse`, `alternate`, or `alternate-reverse`, as in CSS animations.
 * @attr {boolean} erase - After drawing in, keep going until the stroke has wiped itself out from its start.
 * @attr {string} select - Which shapes to animate, as a selector. Default: every path, line, polyline, polygon, circle, ellipse, and rect.
 * @attr {string} start - `visible`: wait to play until the drawing scrolls into view. Default: play on connect.
 * @attr {boolean} paused - Whether it's paused. Reflects; write it in markup to start paused (strokes hidden).
 *
 * @fires play - It started or resumed.
 * @fires pause - It paused.
 * @fires ended - Every shape finished drawing (not for `iterations="infinite"`).
 *
 * Invoker commands: `--play`, `--pause`, `--toggle`, and `--restart`
 * (`<button commandfor="logo" command="--restart">`).
 */
export default class DrawSvg extends HTMLElement {
  static observedAttributes = ["duration", "delay", "stagger", "easing", "iterations", "direction", "erase", "select", "paused"];

  #animations = [];
  #touched = new Map(); // shape -> whether we added its pathLength
  #observer = new MutationObserver(() => this.#rebuild());
  #visibility = null;
  #reflecting = false;
  #connected = false;

  constructor() {
    super();
    this.addEventListener("command", (event) => {
      if (event.command === "--play") this.play();
      else if (event.command === "--pause") this.pause();
      else if (event.command === "--toggle") this.paused ? this.play() : this.pause();
      else if (event.command === "--restart") this.restart();
    });
  }

  connectedCallback() {
    this.#connected = true;
    this.#observer.observe(this, { childList: true, subtree: true });
    // start="visible": paused (and saying so) until it's scrolled into
    // view, including after a move, unless it has played since.
    const waitForView = this.getAttribute("start") === "visible" && (!this.paused || this.#waitingForView);
    if (waitForView) {
      this.#waitingForView = true;
      this.#setPaused(true);
    }
    this.#build({ startPaused: this.paused });
    if (waitForView) this.#waitUntilVisible();
  }

  disconnectedCallback() {
    this.#connected = false;
    this.#observer.disconnect();
    this.#visibility?.disconnect();
    this.#visibility = null;
    this.#teardown();
  }

  attributeChangedCallback(name, previous, current) {
    if (!this.#connected || this.#reflecting) return;
    if (name === "paused") {
      // The attribute already changed, so act on it here rather than
      // through play()/pause(), which compare against it.
      if (current === null && previous !== null) {
        this.#resume();
        this.dispatchEvent(new Event("play", { bubbles: true }));
      } else if (current !== null && previous === null) {
        for (const animation of this.#animations) animation.pause();
        this.dispatchEvent(new Event("pause", { bubbles: true }));
      }
      return;
    }
    this.#rebuild();
  }

  /**
   * Whether it's paused.
   * @type {boolean}
   * @readonly
   */
  get paused() {
    return this.hasAttribute("paused");
  }

  /**
   * The shapes being animated.
   * @type {SVGGeometryElement[]}
   * @readonly
   */
  get shapes() {
    return [...this.#touched.keys()];
  }

  /** Start or resume drawing. */
  play() {
    const wasPaused = this.paused;
    this.#setPaused(false);
    this.#resume();
    if (wasPaused) this.dispatchEvent(new Event("play", { bubbles: true }));
  }

  #resume() {
    this.#waitingForView = false;
    this.#visibility?.disconnect();
    this.#visibility = null;
    const replay = this.#animations.some((animation) => animation.playState === "finished");
    for (const animation of this.#animations) animation.play();
    if (replay) this.#watchEnd();
  }
  #waitingForView = false;

  /** Pause where it is. */
  pause() {
    const wasPaused = this.paused;
    this.#setPaused(true);
    for (const animation of this.#animations) animation.pause();
    if (!wasPaused) this.dispatchEvent(new Event("pause", { bubbles: true }));
  }

  /** Draw again from the start (and play, unless paused). */
  restart() {
    for (const animation of this.#animations) {
      animation.currentTime = 0;
      if (!this.paused) animation.play();
    }
    this.#watchEnd();
  }

  #setPaused(paused) {
    this.#reflecting = true;
    this.toggleAttribute("paused", paused);
    this.#reflecting = false;
  }

  #waitUntilVisible() {
    this.#visibility = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) this.play();
    }, { threshold: 0.25 });
    // The wrapper may be display: contents; observe what's drawn.
    for (const svg of this.querySelectorAll("svg")) this.#visibility.observe(svg);
  }

  // Rebuild after a change, keeping the position and paused state.
  #rebuild() {
    const time = this.#animations[0]?.currentTime ?? 0;
    this.#build({ startPaused: this.paused });
    for (const animation of this.#animations) animation.currentTime = time;
  }

  #build({ startPaused }) {
    this.#observer.disconnect();
    this.#teardown();
    if (!reducedMotion()) {
      let shapes = [];
      try {
        shapes = [...this.querySelectorAll(this.getAttribute("select") || SHAPES)];
      } catch {
        shapes = []; // invalid selector
      }
      shapes = shapes.filter((shape) => shape instanceof SVGGeometryElement);
      const duration = Math.max(0, time(this.getAttribute("duration"), 2000));
      const delay = time(this.getAttribute("delay"), 0);
      const stagger = time(this.getAttribute("stagger"), 0);
      const iterationsText = this.getAttribute("iterations");
      const iterations = iterationsText === "infinite" ? Infinity : Math.max(0, Number(iterationsText ?? 1) || 1);
      const direction = this.getAttribute("direction") || "normal";
      const easing = this.getAttribute("easing") || "ease-in-out";
      const keyframes = this.hasAttribute("erase")
        ? [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }, { strokeDashoffset: -1 }]
        : [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }];
      shapes.forEach((shape, i) => {
        this.#touched.set(shape, !shape.hasAttribute("pathLength"));
        if (!shape.hasAttribute("pathLength")) shape.setAttribute("pathLength", "1");
        shape.style.strokeDasharray = "1";
        let animation;
        try {
          animation = shape.animate(keyframes, { duration, delay: delay + i * stagger, iterations, direction, easing, fill: "both" });
        } catch {
          // an invalid easing or direction: fall back to the defaults
          animation = shape.animate(keyframes, { duration, delay: delay + i * stagger, iterations, fill: "both" });
        }
        if (startPaused) animation.pause();
        this.#animations.push(animation);
      });
      this.#watchEnd();
    }
    this.#observer.observe(this, { childList: true, subtree: true });
  }

  // Fire `ended` once this run finishes; a later run (a replay, restart,
  // or rebuild) supersedes it.
  #watchEnd() {
    const run = (this.#run = {});
    const animations = this.#animations;
    if (!animations.length) return;
    Promise.all(animations.map((animation) => animation.finished)).then(
      () => {
        if (this.#run === run) this.dispatchEvent(new Event("ended", { bubbles: true }));
      },
      () => {}, // cancelled by a rebuild or removal
    );
  }
  #run = null;

  // Undo everything: the SVG goes back to exactly what was written.
  #teardown() {
    for (const animation of this.#animations) animation.cancel();
    this.#animations = [];
    for (const [shape, addedLength] of this.#touched) {
      shape.style.removeProperty("stroke-dasharray");
      if (!shape.getAttribute("style")) shape.removeAttribute("style");
      if (addedLength) shape.removeAttribute("pathLength");
    }
    this.#touched.clear();
  }
}
