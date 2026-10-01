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
