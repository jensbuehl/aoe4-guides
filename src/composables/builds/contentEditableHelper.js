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
    const match = contentEditable.innerHTML.match(/\w*(?<![a-zA-Z0-9])::(([a-zA-Z0-9])+)?/g);
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
  const match = contentEditable.innerHTML.match(/\w*(?<![a-zA-Z0-9])::(([ a-zA-Z0-9])+)?/g);

  if (match) {
    const shortHand = match[0].toLowerCase().trim().replace("::", "");
    const filter = (unfiltered) => {
      return unfiltered.filter((item) => {
        var elementFound = false;
        //Search by shorthand first
        if (Array.isArray(item.shorthand)) {
          elementFound = -1 != item.shorthand.findIndex((element) => element.startsWith(shortHand));
        } else {
          elementFound = item.shorthand?.startsWith(shortHand);
        }
        //Search by title second
        if (!elementFound) {
          var title = item.title.replace(/ +/g, "").toLowerCase();
          elementFound = title.includes(shortHand);
        }
        return elementFound;
      });
    };
    const filteredCivIcons = filter(icons).sort(function (a, b) {
      return a.title.length - b.title.length;
    });
    const imageMetaData = filteredCivIcons[0];

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
  var match = contentEditable.innerHTML.match(/\w*(?<![a-zA-Z0-9])::(([a-zA-Z0-9])+)?/g);
  if (match) {
    //Replace element
    contentEditable.innerHTML = contentEditable.innerHTML.replace(
      /\w*(?<![a-zA-Z0-9])::(([a-zA-Z0-9])+)?/g,
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
