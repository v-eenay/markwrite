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
    const text = line.text;
    
    // Check if this line is the start of a code block
    const match = text.match(/^```(\w*)$/);
    if (match) {
      startLine = i;
      language = match[1] || null;
      break;
    }
  }
  
  // If we found a start, look forward for the end
  if (startLine !== null) {
    for (let i = startLine + 1; i <= doc.lines; i++) {
      const line = doc.line(i);
      const text = line.text;
      
      // Check if this line is the end of the code block
      if (text.match(/^```$/)) {
        // Check if our position is between start and end
        const startPos = doc.line(startLine).from;
        const endPos = line.to;
        
        if (pos > startPos && pos < endPos) {
          return language;
        }
        
        break;
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
