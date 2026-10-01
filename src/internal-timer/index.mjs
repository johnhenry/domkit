import delay from "../delay/index.mjs";
import frameDelay from "../frame-delay/index.mjs";

export default class extends HTMLElement {
  constructor() {
    super();
    this.run = 0;
  }
  connectedCallback() {
    // Build the slot and bind handlers once -- reconnecting used to append
    // another <slot> and add a second "pause" listener every time.
    if (!this.shadow) {
      this.shadow = this.attachShadow({ mode: "open" });
      this.slotted = this.shadow.appendChild(document.createElement("slot"));
      this.slotted.style = "display:none";
      this.slotChange = this.slotChange.bind(this);
      this.handleEvent = this.handleEvent.bind(this);
    }
    this.slotted.addEventListener("slotchange", this.slotChange);
    this.addEventListener("pause", this.handleEvent);
    if (this.suspended) {
      this.suspended = false;
      this.reset();
    }
  }
  disconnectedCallback() {
    this.break = true;
    this.suspended = true;
    this.slotted.removeEventListener("slotchange", this.slotChange);
    this.removeEventListener("pause", this.handleEvent);
  }
  slotChange() {
    this.fps = Number(this.getAttribute("fps") || 60);
    this.reset();
  }
  async reset() {
    // Each loop remembers which run it is; starting a new one (reconnect,
    // content change, resume) retires any loop still awaiting a frame --
    // otherwise moving the element (disconnect + reconnect in one task)
    // left the old loop running alongside the new one, doubling the rate.
    const run = ++this.run;
    this.break = false;
    while (true) {
      await frameDelay(this.fps);
      if (run !== this.run) {
        return;
      }
      if (this.break) {
        this.dispatchEvent(new Event("paused"));
        break;
      }
      this.dispatchEvent(new Event("tick", { bubbles: true }));
    }
    this.break = false;
  }
  async handleEvent({ type, detail }) {
    switch (type) {
      case "pause":
        this.break = true;
        if (detail) {
          await delay(detail);
          this.reset();
        }
        break;
    }
  }
}
