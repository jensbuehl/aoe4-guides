import { nextTick } from "vue";

/**
 * Enter in a field of a multi-field form. A key labelled "next" has to mean
 * next: iOS sends its "next" key as a plain Enter, and submitting there would
 * flag the fields the user has not reached yet. So Enter moves on to the first
 * empty field below this one, and submits once every field below is filled —
 * which keeps a desktop Enter in an autofilled form submitting as before.
 * (Android Chrome advances on "next" by itself, without an Enter.)
 *
 * `submit` resolves to `false` when validation failed; the first invalid field
 * then takes the focus, so the keyboard stays up on what needs fixing.
 *
 * Use as `@keydown.enter.prevent="(e) => advanceOrSubmit(e, submit)"`, with
 * `enterkeyhint="next"` on every field but the last.
 */
export async function advanceOrSubmit(event, submit) {
  const form = event.target.form;
  const fields = [...(form?.querySelectorAll("input:not([hidden])") ?? [])];
  const next = fields.slice(fields.indexOf(event.target) + 1).find((f) => !f.value);
  if (next) {
    next.focus();
    return;
  }
  if ((await submit()) === false && form) {
    await nextTick();
    form.querySelector(".v-input--error input")?.focus();
  }
}
