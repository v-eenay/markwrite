/**
 * Common utility functions for markdown processing and UI operations
 */

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
 * Decodes HTML entities in text
 * @param {string} text - The text to decode
 * @returns {string} - The decoded text
 */
export function decodeHtmlEntities(text) {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/**
 * Escapes HTML in text for security
 * @param {string} text - The text to escape
 * @returns {string} - The escaped text
 */
export function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, "'"); // Use plain single quote instead of entity
}

/**
 * Extracts a filename from markdown content
 * Uses the first heading if available, otherwise uses a default name
 * @param {string} markdown - The markdown content
 * @param {string} extension - The file extension (default: 'txt')
 * @returns {string} The filename
 */
export function getFilenameFromMarkdown(markdown, extension = 'txt') {
  // Try to extract the first heading from markdown
  const headingMatch = markdown.match(/^# (.+)$/m);
  if (headingMatch && headingMatch[1]) {
    // Clean the heading to make it suitable for a filename
    return `${headingMatch[1].replace(/[^a-z0-9]/gi, '-').toLowerCase()}.${extension}`;
  }
  return `markwrite-document.${extension}`;
}

/**
 * Process page breaks in markdown content
 * @param {string} markdown - The markdown content
 * @returns {string} - The processed markdown with HTML page break elements
 */
export function processPageBreaks(markdown) {
  return (markdown || '').replace(/---pagebreak---/g, '\n\n<div class="page-break"></div>\n\n');
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
