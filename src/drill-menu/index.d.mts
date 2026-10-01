// Generated from custom-elements.json by scripts/manifest-outputs.mjs.
// Do not edit: change the JSDoc in index.mjs and run `npm run manifest`.

/** A menu whose items drill into screens (each item's `<template>`), with
 * roving keyboard focus, Back via Esc/`data-back`/commands, focus
 * restoration, and optional `location.hash` sync. */
export default class DrillMenu extends HTMLElement {
  /** The items: element children other than templates and the screen. */
  readonly items: Element[];
  /** Key of the open screen, or null. Setting it navigates. */
  screen: string | null;
  /** Mirrors the `disabled` attribute. */
  disabled: boolean;
  syncHash: boolean;
  /** Show the screen of the item with this key (its `data-key`, or its
   * position). Items without a template are leaves and can't be pushed. */
  push(key: string | number, options?: { focus?: boolean }): boolean;
  /** Return to the list, restoring focus to the item that opened the screen. */
  pop(options?: { focus?: boolean }): void;
}

declare global {
  interface HTMLElementTagNameMap {
    "drill-menu": DrillMenu;
  }
}
