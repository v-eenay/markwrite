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
 * Process page breaks in markdown content with smart placement
 * @param {string} markdown - The markdown content
 * @returns {string} - The processed markdown with HTML page break elements
 */
export function processPageBreaks(markdown) {
  if (!markdown) return '';

  // Split content by page breaks to analyze each section
  const sections = markdown.split(/---pagebreak---/);

  if (sections.length <= 1) {
    // No page breaks found
    return markdown;
  }

  const processedSections = [];

  for (let i = 0; i < sections.length; i++) {
    let section = sections[i];

    if (i > 0) {
      // This is not the first section, so we need to add a page break before it
      // Check if the previous section ends with incomplete content
      const prevSection = processedSections[processedSections.length - 1];
      const currentSectionStart = section.trim();

      // Smart page break placement logic
      section = insertSmartPageBreak(prevSection, section);
    }

    processedSections.push(section);
  }

  return processedSections.join('');
}

/**
 * Insert a page break with smart placement to avoid cutting off content mid-sentence
 * @param {string} prevSection - The previous section content
 * @param {string} currentSection - The current section content
 * @returns {string} - The current section with a properly placed page break
 */
function insertSmartPageBreak(prevSection, currentSection) {
  // Clean up the current section
  currentSection = currentSection.trim();

  // If the current section is empty or starts with a heading, place page break normally
  if (!currentSection || currentSection.match(/^#+\s/)) {
    return '\n\n<div class="page-break"></div>\n\n' + currentSection;
  }

  // If the current section starts with a list item, place page break normally
  if (currentSection.match(/^[\s]*[-*+]\s/) || currentSection.match(/^[\s]*\d+\.\s/)) {
    return '\n\n<div class="page-break"></div>\n\n' + currentSection;
  }

  // If the current section starts with a code block, place page break normally
  if (currentSection.match(/^```/)) {
    return '\n\n<div class="page-break"></div>\n\n' + currentSection;
  }

  // If the current section starts with a blockquote, place page break normally
  if (currentSection.match(/^>/)) {
    return '\n\n<div class="page-break"></div>\n\n' + currentSection;
  }

  // Check if we're in the middle of a paragraph
  const lines = currentSection.split('\n');
  const firstLine = lines[0].trim();

  // If the first line looks like a continuation of a sentence (starts with lowercase)
  // or contains sentence continuation indicators, add some spacing
  if (firstLine && (
    firstLine.match(/^[a-z]/) || // starts with lowercase
    firstLine.match(/^(and|but|or|so|yet|for|nor|however|therefore|moreover|furthermore|additionally|meanwhile|consequently|thus|hence)\s/i) || // conjunction
    firstLine.match(/^(that|which|who|whom|whose|where|when|why|how)\s/i) // relative pronouns
  )) {
    // This looks like a sentence continuation, add a warning comment
    return '\n\n<!-- Page break may interrupt content flow -->\n<div class="page-break"></div>\n\n' + currentSection;
  }

  // Default case: place page break normally
  return '\n\n<div class="page-break"></div>\n\n' + currentSection;
}

/**
 * Analyze content around page breaks and provide warnings for potential formatting issues
 * @param {string} markdown - The markdown content with page breaks
 * @returns {Array} - Array of warnings about potential formatting issues
 */
export function analyzePageBreakPlacement(markdown) {
  const warnings = [];

  if (!markdown) return warnings;

  // Find all page break locations
  const pageBreakRegex = /---pagebreak---/g;
  let match;

  while ((match = pageBreakRegex.exec(markdown)) !== null) {
    const beforeBreak = markdown.substring(Math.max(0, match.index - 100), match.index);
    const afterBreak = markdown.substring(match.index + match[0].length, Math.min(markdown.length, match.index + match[0].length + 100));

    // Check for potential issues
    const beforeLines = beforeBreak.split('\n');
    const afterLines = afterBreak.split('\n');

    const lastLineBefore = beforeLines[beforeLines.length - 1]?.trim() || '';
    const firstLineAfter = afterLines[0]?.trim() || '';

    // Check if we're breaking in the middle of a sentence
    if (lastLineBefore && !lastLineBefore.match(/[.!?]$/) && firstLineAfter && firstLineAfter.match(/^[a-z]/)) {
      warnings.push({
        type: 'sentence-break',
        position: match.index,
        message: 'Page break may split a sentence',
        context: { before: lastLineBefore, after: firstLineAfter }
      });
    }

    // Check if we're breaking in the middle of a list
    if (lastLineBefore.match(/^[\s]*[-*+]\s/) && firstLineAfter.match(/^[\s]*[-*+]\s/)) {
      warnings.push({
        type: 'list-break',
        position: match.index,
        message: 'Page break splits a list',
        context: { before: lastLineBefore, after: firstLineAfter }
      });
    }

    // Check if we're breaking in the middle of a code block
    const beforeText = beforeBreak.substring(Math.max(0, beforeBreak.length - 200));
    const codeBlockMatches = (beforeText.match(/```/g) || []).length;
    if (codeBlockMatches % 2 === 1) {
      warnings.push({
        type: 'code-block-break',
        position: match.index,
        message: 'Page break may be inside a code block',
        context: { before: lastLineBefore, after: firstLineAfter }
      });
    }
  }

  return warnings;
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
