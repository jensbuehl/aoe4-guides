/**
 * Function to add an inline icon to the contentEditable element at the position of the found search text or menu activator sequence
 *
 * @param {Element} contentEditable - the contentEditable element to which the icon will be added
 * @param {Array} allCivIcons - an array containing all the civilization icons
 * @return {void} This function does not return a value
 */
export function addInlineIcon(contentEditable, allCivIcons) {
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
    const filteredCivIcons = filter(allCivIcons).sort(function (a, b) {
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
    contentEditable.innerHTML = contentEditable.innerHTML.replace(/\w*(?<![a-zA-Z0-9])::(([a-zA-Z0-9])+)?/g, img);

    // restore the position
    sel.removeAllRanges();
    var range = document.createRange();
    range.setStart(contentEditable, pos.pos);
    range.collapse(true);
    sel.addRange(range);
  }
}

function getCursorPositionAfterIcon(parent, node, offset, status) {
  if (status.done) return status;

  let currentNode = null;

  for (let i = 0; i < parent.childNodes.length && !status.done; i++) {
    currentNode = parent.childNodes[i];
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
