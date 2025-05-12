/**
 * Debounce function to limit the rate at which a function can fire
 * @param {Function} func - The function to debounce
 * @param {number} wait - The time to wait in milliseconds
 * @returns {Function} - The debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Get the cursor position in a textarea
 * @param {HTMLTextAreaElement} textarea - The textarea element
 * @returns {Object} - The line and column of the cursor
 */
export function getCursorPosition(textarea) {
  const text = textarea.value;
  const selectionStart = textarea.selectionStart;
  
  // Count newlines before the cursor
  const textBeforeCursor = text.substring(0, selectionStart);
  const lines = textBeforeCursor.split('\n');
  const lineNumber = lines.length;
  const columnNumber = lines[lines.length - 1].length + 1;
  
  return { line: lineNumber, column: columnNumber };
}

/**
 * Insert text at the cursor position in a textarea
 * @param {HTMLTextAreaElement} textarea - The textarea element
 * @param {string} text - The text to insert
 */
export function insertTextAtCursor(textarea, text) {
  const selectionStart = textarea.selectionStart;
  const selectionEnd = textarea.selectionEnd;
  const textBeforeCursor = textarea.value.substring(0, selectionStart);
  const textAfterCursor = textarea.value.substring(selectionEnd);
  
  textarea.value = textBeforeCursor + text + textAfterCursor;
  
  // Move cursor after the inserted text
  textarea.selectionStart = textarea.selectionEnd = selectionStart + text.length;
  textarea.focus();
}
