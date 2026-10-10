// Validation messages in the user's language, borrowed from native
// controls: a detached <input required> / <select required> reports the
// browser's own localized "please fill this in" text. Used by the
// form-associated elements so their messages match native ones exactly.
// (Internal helper: not part of the public API.)

let input;
let select;

/** The browser's message for an empty required text field. */
export function valueMissingText() {
  input ??= Object.assign(document.createElement("input"), { required: true });
  return input.validationMessage || "Please fill out this field.";
}

/** The browser's message for a required list with nothing selected. */
export function valueMissingSelect() {
  if (!select) {
    select = document.createElement("select");
    select.required = true;
    select.multiple = true; // a listbox with no selection is "missing"
  }
  return select.validationMessage || "Please select an item in the list.";
}

/**
 * A too-long message. Fixed English: a native control only reports tooLong
 * after a real user edit, so (unlike valueMissing) its wording can't be
 * borrowed from a detached element.
 */
export function tooLongText(max, length) {
  return `Please shorten this text to ${max} characters or less (you are currently using ${length} characters).`;
}

/** A too-short message (fixed English, for the same reason as tooLongText). */
export function tooShortText(min, length) {
  return `Please lengthen this text to ${min} characters or more (you are currently using ${length} characters).`;
}
