// Tracks which mount-point elements were created by first.mjs/last.mjs (as
// opposed to an existing suitable element that was found and reused), so
// unmount.mjs knows what it's actually safe to remove -- mounts doesn't own
// a reused element and has no business deleting content that was already
// on the page.
export const created = new WeakSet();
