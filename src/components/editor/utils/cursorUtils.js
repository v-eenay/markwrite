/**
 * Save the current selection state in a contentEditable element
 * @param {HTMLElement} element - The contentEditable element
 * @returns {Object|null} Selection state object or null if no selection
 */
export function saveSelection(element) {
  if (!element) return null;
  
  const selection = window.getSelection();
  if (selection.rangeCount === 0) return null;
  
  const range = selection.getRangeAt(0);
  
  // Check if the selection is within the element
  if (!element.contains(range.commonAncestorContainer)) return null;
  
  return {
    startContainer: range.startContainer,
    startOffset: range.startOffset,
    endContainer: range.endContainer,
    endOffset: range.endOffset,
    collapsed: range.collapsed
  };
}

/**
 * Restore a previously saved selection
 * @param {HTMLElement} element - The contentEditable element
 * @param {Object} savedSelection - The saved selection state
 * @returns {boolean} Whether the restoration was successful
 */
export function restoreSelection(element, savedSelection) {
  if (!element || !savedSelection) return false;
  
  try {
    const selection = window.getSelection();
    const range = document.createRange();
    
    // Check if the saved containers are still in the document
    if (!document.contains(savedSelection.startContainer) || 
        !document.contains(savedSelection.endContainer)) {
      return false;
    }
    
    // Set the range boundaries
    range.setStart(
      savedSelection.startContainer, 
      Math.min(savedSelection.startOffset, savedSelection.startContainer.textContent?.length || 0)
    );
    
    range.setEnd(
      savedSelection.endContainer,
      Math.min(savedSelection.endOffset, savedSelection.endContainer.textContent?.length || 0)
    );
    
    // Apply the range to the selection
    selection.removeAllRanges();
    selection.addRange(range);
    
    return true;
  } catch (error) {
    console.error('Error restoring selection:', error);
    return false;
  }
}

/**
 * Get the current cursor position in a textarea
 * @param {HTMLTextAreaElement} textarea - The textarea element
 * @returns {number} The cursor position
 */
export function getTextareaCursorPosition(textarea) {
  return textarea.selectionStart;
}

/**
 * Set the cursor position in a textarea
 * @param {HTMLTextAreaElement} textarea - The textarea element
 * @param {number} position - The position to set the cursor
 */
export function setTextareaCursorPosition(textarea, position) {
  textarea.focus();
  textarea.setSelectionRange(position, position);
}

/**
 * Get the approximate cursor position in a contentEditable element
 * @param {HTMLElement} element - The contentEditable element
 * @returns {number} The approximate character offset
 */
export function getContentEditableCursorOffset(element) {
  const selection = window.getSelection();
  if (selection.rangeCount === 0) return 0;
  
  const range = selection.getRangeAt(0);
  if (!element.contains(range.commonAncestorContainer)) return 0;
  
  // Create a range from the start of the element to the cursor
  const preCaretRange = document.createRange();
  preCaretRange.setStart(element, 0);
  preCaretRange.setEnd(range.startContainer, range.startOffset);
  
  // Get the text content of this range
  const text = preCaretRange.toString();
  return text.length;
}

/**
 * Find a position in a contentEditable element by character offset
 * @param {HTMLElement} element - The contentEditable element
 * @param {number} offset - The character offset
 * @returns {Object|null} Position object or null if not found
 */
export function findPositionByOffset(element, offset) {
  if (!element || offset < 0) return null;
  
  // Traverse the DOM tree to find the position
  const treeWalker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  let currentOffset = 0;
  let currentNode = treeWalker.nextNode();
  
  while (currentNode) {
    const nodeLength = currentNode.nodeValue.length;
    
    if (currentOffset + nodeLength >= offset) {
      return {
        node: currentNode,
        offset: offset - currentOffset
      };
    }
    
    currentOffset += nodeLength;
    currentNode = treeWalker.nextNode();
  }
  
  // If we couldn't find the exact position, return the last position
  if (element.lastChild) {
    const lastTextNode = findLastTextNode(element.lastChild);
    if (lastTextNode) {
      return {
        node: lastTextNode,
        offset: lastTextNode.nodeValue.length
      };
    }
  }
  
  return null;
}

/**
 * Find the last text node in a DOM subtree
 * @param {Node} node - The root node to search from
 * @returns {Node|null} The last text node or null if none found
 */
function findLastTextNode(node) {
  if (node.nodeType === Node.TEXT_NODE) return node;
  
  if (node.lastChild) {
    for (let child = node.lastChild; child; child = child.previousSibling) {
      const textNode = findLastTextNode(child);
      if (textNode) return textNode;
    }
  }
  
  return null;
}
