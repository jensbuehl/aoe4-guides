# Parked idea: a rich-text core for the build order editor

**Status:** parked on 2026-11-25, by the owner's decision. Not a spec and not
scheduled. Revisit only when one of the triggers below fires.

This was "block 3" of an editor UX review. Blocks 1 and 2 shipped instead
(keyboard flow, `::` autocomplete, Undo instead of delete dialogs, the
Shortcuts list, Alt+Shift+Enter). After them the editor was judged good
enough, and this rework was judged to cost more than it would return now.

## The idea

Two independent parts:

1. **Descriptions and notes on a rich-text core** (ProseMirror, for example
   through TipTap), with an inline icon node. The stored HTML stays exactly
   what it is today, so the reading view, Focus mode and the overlay export
   do not change.
2. **Split `BuildOrderSectionEditor.vue` by layout.** The desktop table and
   the phone cards share one 5,000+ line component and are both always
   mounted (`liveLayout()` picks the visible one).

## What it would give authors

Part 1 only. Part 2 is maintainability alone and changes nothing anyone sees.

- **Text undo that survives an icon.** Icons are inserted by replacing the
  field's `innerHTML`, which clears the browser's undo history for that field.
- **A caret that stays put.** Icon insertion and line breaks recompute the
  caret by hand (`getCursorPositionAfterIcon`, `getLineBreakPosition` in
  `contentEditableHelper.js`).
- **An icon is one character.** One Backspace removes it; selecting, copying
  and pasting across icons behaves.
- **One behaviour in every browser.** Firefox's `<div>` wrappers, Android
  IMEs that send keyCode 0, and Chrome's `<br>` leftovers (`dropLeavings`)
  are each handled by a special case today.

## What it would cost

- Several days of rework on the editor, which is the part of the app with the
  most edge cases (alternatives blocks, notes, two layouts, reordering).
- Roughly 40–50 KB gzipped of library, loadable for the editor route only.
- The risk that the editor writes HTML that differs from today's, which every
  reader of a build would see. A round-trip test over real builds would be
  the gate.

## Triggers to revisit

- Authors report the caret jumping, lost text after inserting an icon, or
  broken paste. Check first whether a targeted fix in
  `contentEditableHelper.js` would do.
- A test pass in Firefox, Safari and on an Android keyboard turns up several
  contenteditable bugs at once. As of 2026-11-25 the editor had been verified
  in Chrome only.
- A new feature needs structured text in descriptions, such as formatting or
  mentions, and would otherwise add more `innerHTML` surgery.
- Part 2 alone: the next large editor feature that has to be written twice,
  once per layout.
