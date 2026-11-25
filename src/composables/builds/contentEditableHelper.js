/**
 * The icons a `::` search matches, best first.
 *
 * The one ranking both ways of finishing a search use: the menu lists in this
 * order and highlights the first entry, and Space on a keyboard the menu
 * cannot hear (Android IMEs send no usable keydown) inserts that same first
 * entry. They used to rank separately (the menu in list order, Space by shortest
 * title), so Space could insert an icon other than the one on screen.
 *
 * A shorthand someone typed in full beats one they are partway through, and both
 * beat the title: a shorthand is a name chosen to be typed. A title that starts
 * with the query beats one that only contains it. Ties go to the shorter title,
 * which is what Space alone used to decide on, then to list order.
 *
 * An empty query matches nothing. It used to match everything, so `::` followed
 * by a space inserted whichever icon had the shortest title.
 *
 * @param {Array} icons - The civ's icons, as iconService returns them.
 * @param {string} query - What follows `::`, lower-case and trimmed.
 * @return {Array} The matching icons, best first.
 */
export function rankIcons(icons, query) {
  if (!query) return [];

  const rank = (item) => {
    const shorthands = [].concat(item.shorthand ?? []);
    if (shorthands.includes(query)) return 0;
    if (shorthands.some((s) => s.startsWith(query))) return 1;
    const title = item.title.replace(/ +/g, "").toLowerCase();
    if (title.startsWith(query)) return 2;
    if (title.includes(query)) return 3;
    return -1;
  };

  return icons
    .map((item, order) => ({ item, order, rank: rank(item) }))
    .filter((entry) => entry.rank >= 0)
    .sort(
      (a, b) =>
        a.rank - b.rank || a.item.title.length - b.item.title.length || a.order - b.order
    )
    .map((entry) => entry.item);
}

/**
 * An icon's shorthands as they are typed, e.g. "::rax, ::qs", or "" for none.
 *
 * @param {string|string[]|undefined} shorthand - The icon's `shorthand` field.
 * @return {string}
 */
export function formatShorthand(shorthand) {
  return [].concat(shorthand || []).filter(Boolean).map((s) => "::" + s).join(", ");
}

/**
 * Updates the search text based on the key code pressed.
 *
 * @param {HTMLElement} contentEditable - The content editable element based on which the search text is being updated.
 * @param {HTMLInputElement} searchTextRef - The reference to the search text input element.
 * @param {number} keyCode - The key code of the key that was pressed.
 */
export function updateSearchText(contentEditable, searchTextRef, keyCode, icons) {
  const sel = window.getSelection();

  //handle enter and fix line-break
  if (keyCode === 13) {
    //Skip e.g. on firefox
    if (contentEditable.innerHTML.includes("\n")) {
      //get linebreak position
      const pos = getLineBreakPosition(contentEditable);
      contentEditable.innerHTML = contentEditable.innerHTML.replace(/\n/gm, "<br>");

      // restore the position
      sel.removeAllRanges();
      var range = document.createRange();
      range.setStart(contentEditable, pos + 1);
      range.collapse(true);
      sel.addRange(range);

      searchTextRef.value = null;
    }
  }
  //Handle space
  else if (keyCode === 32 || keyCode === 0) {
    addInlineIcon(contentEditable, icons);
    searchTextRef.value = null;
  }
  //Handle ESC
  else if (keyCode === 27) {
    searchTextRef.value = null;
  } else {
    //Show and hide autocomplete menu, set search text
    const match = contentEditable.innerHTML.match(/\w*(?<![a-zA-Z0-9])::(([a-zA-Z0-9_])+)?/g);
    if (!match) {
      //no match found
      searchTextRef.value = null;
    } else if (match[0]?.length > 2) {
      //show filtered completion menu
      searchTextRef.value = match[0].toLowerCase().trim().replace("::", "");
    } else if (match[0]) {
      //only colon => show unfiltered completion menu
      searchTextRef.value = "::";
    }
  }
}

/**
 * Function to add an inline icon to the contentEditable element at the position of the found search text or menu activator sequence
 *
 * @param {Element} contentEditable - the contentEditable element to which the icon will be added
 * @param {Array} icons - an array containing all the civilization icons
 * @return {void} This function does not return a value
 */
export function addInlineIcon(contentEditable, icons) {
  //if DIV wrapper, then use this element as root instead of the contentEditable (Needed for firefox compatibility)
  if (contentEditable.childNodes[0].tagName === "DIV") {
    contentEditable = contentEditable.childNodes[0];
  }

  //get target cursor position
  const sel = window.getSelection();
  const node = sel.focusNode;
  const offset = sel.focusOffset;
  const pos = getCursorPositionAfterIcon(contentEditable, node, offset, {
    pos: 0,
    done: false,
  });

  //parse and replace
  const match = contentEditable.innerHTML.match(/\w*(?<![a-zA-Z0-9])::(([ a-zA-Z0-9_])+)?/g);

  if (match) {
    const shortHand = match[0].toLowerCase().trim().replace("::", "");
    //rankIcons() returns nothing for an empty query, so ":: " stays as typed.
    const imageMetaData = rankIcons(icons, shortHand)[0];

    if (imageMetaData) {
      const iconClass = imageMetaData.class ? "icon-" + imageMetaData.class : "icon";
      const iconPath = imageMetaData.imgSrc;
      const iconTooltipText = imageMetaData.title;

      const img =
        '<img src="' +
        iconPath +
        '" class=' +
        iconClass +
        ' title="' +
        iconTooltipText +
        '"></img>';

      //Replace element
      contentEditable.innerHTML = contentEditable.innerHTML.replace(match[0], img);

      // restore the position
      sel.removeAllRanges();
      var range = document.createRange();
      range.setStart(contentEditable, pos.pos);
      range.collapse(true);
      sel.addRange(range);
    }
  }
}

/**
 * Generates an image and inserts it into the contentEditable element at the position of the found search text or menu activator sequence
 *
 * @param {Element} contentEditable - The contentEditable element where the icon will be inserted.
 * @param {string} iconPath - The path to the icon image.
 * @param {string} tooltipText - The text to display as a tooltip for the icon.
 * @param {string} iconClass - The CSS class for styling the icon.
 */
export function addAutocompleteIcon(contentEditable, iconPath, tooltipText, iconClass) {
  iconClass = iconClass ? "icon-" + iconClass : "icon";
  const img =
    '<img src="' + iconPath + '" class=' + iconClass + ' title="' + tooltipText + '"></img>';

  //if DIV wrapper, then use this element as root instead of the contentEditable (Needed for firefox compatibility)
  if (contentEditable.childNodes[0].tagName === "DIV") {
    contentEditable = contentEditable.childNodes[0];
  }

  //get target cursor position
  const sel = window.getSelection();
  const node = sel.focusNode;
  const offset = sel.focusOffset;
  const pos = getCursorPositionAfterIcon(contentEditable, node, offset, {
    pos: 0,
    done: false,
  });

  //parse and replace
  var match = contentEditable.innerHTML.match(/\w*(?<![a-zA-Z0-9])::(([a-zA-Z0-9_])+)?/g);
  if (match) {
    //Replace element
    contentEditable.innerHTML = contentEditable.innerHTML.replace(
      /\w*(?<![a-zA-Z0-9])::(([a-zA-Z0-9_])+)?/g,
      img
    );

    // restore the position
    sel.removeAllRanges();
    var range = document.createRange();
    range.setStart(contentEditable, pos.pos);
    range.collapse(true);
    sel.addRange(range);
  }
}

/**
 * Places the caret at the end of the given contentEditable element.
 *
 * @param {Element} contentEditable - The contentEditable element to place the caret at the end of.
 * @return {void} 
 */
export function placeCaretAtEnd(contentEditable) {
  contentEditable.focus();
  if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
    var range = document.createRange();
    range.selectNodeContents(contentEditable);
    range.collapse(false);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  } else if (typeof document.body.createTextRange != "undefined") {
    var textRange = document.body.createTextRange();
    textRange.moveToElementText(contentEditable);
    textRange.collapse(false);
    textRange.select();
  }
}

/**
 * The units a caret position is counted in: each character of text, and each
 * icon or line break as one, so a position survives the field's markup being
 * re-set from an equivalent string.
 */
const caretUnits = (field) => {
  const units = [];
  const walk = (node) => {
    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        for (let i = 0; i < child.data.length; i++) units.push({ node: child, offset: i });
      } else if (child.nodeName === "IMG" || child.nodeName === "BR") {
        units.push({ node: child });
      } else {
        walk(child);
      }
    }
  };
  walk(field);
  return units;
};

/**
 * Where the caret sits in a field, counted in caretUnits().
 *
 * @param {Element} field - The contentEditable.
 * @return {number|null} The count before the caret, or null when the caret is
 *   not in this field.
 */
export function caretOffset(field) {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return null;

  const range = selection.getRangeAt(0);
  if (!field.contains(range.startContainer)) return null;

  const before = document.createRange();
  before.selectNodeContents(field);
  before.setEnd(range.startContainer, range.startOffset);
  const fragment = document.createElement("div");
  fragment.appendChild(before.cloneContents());
  return caretUnits(fragment).length;
}

/**
 * Focuses a field and puts the caret back at a position from caretOffset().
 *
 * @param {Element} field - The contentEditable.
 * @param {number|null} offset - Units before the caret; null puts it at the end.
 * @return {void}
 */
export function placeCaretAt(field, offset) {
  const units = caretUnits(field);
  if (offset == null || offset >= units.length) return placeCaretAtEnd(field);

  field.focus({ preventScroll: true });
  const unit = units[offset];
  const range = document.createRange();
  if (unit.offset != null) range.setStart(unit.node, unit.offset);
  else range.setStartBefore(unit.node);
  range.collapse(true);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

function getLineBreakPosition(contentEditable) {
  let currentNode = null;

  for (let i = 0; i < contentEditable.childNodes.length; i++) {
    currentNode = contentEditable.childNodes[i];
    if (currentNode.data === "\n") {
      return i;
    }
  }
}

function getCursorPositionAfterIcon(contentEditable, node, offset, status) {
  if (status.done) return status;

  let currentNode = null;

  for (let i = 0; i < contentEditable.childNodes.length && !status.done; i++) {
    currentNode = contentEditable.childNodes[i];
    status.pos++;
    if (currentNode.wholeText?.indexOf("::") > 0) {
      status.pos++;
    }
    if (currentNode === node) {
      status.done = true;
      return status;
    } else getCursorPositionAfterIcon(currentNode, node, offset, status);
  }

  return status;
}
