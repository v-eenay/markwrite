import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';

/**
 * Maps language identifiers to their corresponding language support extensions
 */
export const languageMap = {
  // JavaScript and TypeScript
  'js': javascript(),
  'javascript': javascript(),
  'ts': javascript({ typescript: true }),
  'typescript': javascript({ typescript: true }),
  'jsx': javascript({ jsx: true }),
  'tsx': javascript({ jsx: true, typescript: true }),

  // Python
  'py': python(),
  'python': python(),

  // HTML and CSS
  'html': html(),
  'css': html({ matchClosingTags: true }),
  'xml': html({ matchClosingTags: true }),

  // Java
  'java': java(),

  // C and C++
  'c': cpp(),
  'cpp': cpp(),
  'c++': cpp(),
  'h': cpp(),
  'hpp': cpp(),
};

/**
 * Detects if the cursor is inside a code block and returns the language
 * @param {EditorState} state - The editor state
 * @param {number} pos - The cursor position
 * @returns {string|null} - The detected language or null if not in a code block
 */
export function detectCodeBlockLanguage(state, pos) {
  const doc = state.doc;
  const linePos = doc.lineAt(pos);
  const currentLine = linePos.number;

  // Look backward for the start of a code block
  let startLine = null;
  let language = null;

  for (let i = currentLine; i >= 1; i--) {
    const line = doc.line(i);
    const text = line.text.trim();

    // Check if this line is the start of a code block
    // Match both ```language and ``` language formats
    const match = text.match(/^```(\w*)(?:\s+(\w+))?$/);
    if (match) {
      startLine = i;
      // Use the first captured group if it exists, otherwise try the second group
      language = (match[1] && match[1].length > 0) ? match[1] : (match[2] || null);
      break;
    }

    // If we encounter another code block end marker before finding a start,
    // then we're not in a code block
    if (text === '```') {
      return null;
    }
  }

  // If we found a start, look forward for the end
  if (startLine !== null) {
    // Get the position right after the opening ```
    const startPos = doc.line(startLine).from + doc.line(startLine).text.indexOf('```') + 3;

    for (let i = startLine + 1; i <= doc.lines; i++) {
      const line = doc.line(i);
      const text = line.text.trim();

      // Check if this line is the end of the code block
      if (text === '```') {
        // Check if our position is between start and end
        const endPos = line.from;

        if (pos > startPos && pos < endPos) {
          return language;
        }

        break;
      }

      // If we reach the end of the document without finding a closing marker,
      // check if we're after the opening marker
      if (i === doc.lines && pos > startPos) {
        return language;
      }
    }
  }

  return null;
}

/**
 * Gets the language extension for a detected language
 * @param {string} language - The detected language
 * @returns {Extension|null} - The language extension or null if not supported
 */
export function getLanguageExtension(language) {
  if (!language) return null;

  return languageMap[language.toLowerCase()] || null;
}
