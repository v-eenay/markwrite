import { marked } from 'marked';
import TurndownService from 'turndown';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

// Configure marked for syntax highlighting
marked.setOptions({
  highlight: function(code, lang) {
    try {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      } else {
        return hljs.highlightAuto(code).value;
      }
    } catch (e) {
      console.error('Error highlighting code:', e);
      return code;
    }
  },
  breaks: true,
  gfm: true,
  headerIds: true,
  mangle: false
});

// Configure turndown for HTML to Markdown conversion
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  bulletListMarker: '-',
  hr: '---',
  linkStyle: 'inlined',
  // Improve line break handling
  blankReplacement: (content, node) => {
    return node.isBlock ? '\n\n' : '';
  },
  // Preserve line breaks
  keepReplacement: (content, node) => {
    return node.isBlock ? `\n\n${content}\n\n` : content;
  }
});

// Add rules for code blocks
turndownService.addRule('codeBlocks', {
  filter: function(node) {
    return (
      node.nodeName === 'PRE' &&
      node.firstChild &&
      node.firstChild.nodeName === 'CODE'
    );
  },
  replacement: function(content, node) {
    const code = node.firstChild.textContent;
    const lang = node.firstChild.className.replace('language-', '');
    return `\n\`\`\`${lang}\n${code}\n\`\`\`\n`;
  }
});

// Add rules for checkboxes
turndownService.addRule('checkbox', {
  filter: function(node) {
    return node.nodeName === 'INPUT' && node.type === 'checkbox';
  },
  replacement: function(content, node) {
    return node.checked ? '[x] ' : '[ ] ';
  }
});

// Add rule for line breaks
turndownService.addRule('lineBreaks', {
  filter: 'br',
  replacement: function(content, node) {
    // Use a simple line break instead of a backslash followed by a line break
    return '\n';
  }
});

// Add rule for paragraphs to ensure proper spacing
turndownService.addRule('paragraphs', {
  filter: 'p',
  replacement: function(content, node) {
    return '\n\n' + content + '\n\n';
  }
});

// Add rule for divs to handle them as paragraphs
turndownService.addRule('divs', {
  filter: 'div',
  replacement: function(content, node) {
    return content + '\n';
  }
});

/**
 * Convert Markdown to HTML
 * @param {string} markdown - Markdown content
 * @returns {string} HTML content
 */
export function markdownToHtml(markdown) {
  if (!markdown) return '';
  try {
    // Normalize line breaks in the Markdown before conversion
    const normalizedMarkdown = markdown
      // Ensure consistent line endings
      .replace(/\r\n/g, '\n')
      // Ensure a single newline at the end of the document
      .replace(/\n+$/, '\n');

    // Convert to HTML
    let html = marked.parse(normalizedMarkdown);

    // Post-process the HTML to fix common issues
    html = html
      // Ensure paragraphs have proper spacing
      .replace(/<p>\s*<\/p>/g, '<p>&nbsp;</p>')
      // Fix any consecutive <br> tags
      .replace(/(<br\s*\/?>\s*){2,}/g, '<br><br>')
      // Ensure proper spacing around block elements
      .replace(/(<\/(div|p|h[1-6]|ul|ol|li|blockquote)>)(<(div|p|h[1-6]|ul|ol|li|blockquote))/g, '$1\n$3');

    return html;
  } catch (error) {
    console.error('Error converting Markdown to HTML:', error);
    return '<p>Error rendering Markdown</p>';
  }
}

/**
 * Convert HTML to Markdown
 * @param {string} html - HTML content
 * @returns {string} Markdown content
 */
export function htmlToMarkdown(html) {
  if (!html) return '';
  try {
    // Normalize line breaks in the HTML before conversion
    const normalizedHtml = html
      // Replace any sequence of <br> tags with a single <br>
      .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '<br>')
      // Replace any div that only contains a <br> with a single <br>
      .replace(/<div>\s*<br\s*\/?>\s*<\/div>/gi, '<br>')
      // Replace any empty paragraphs with a single <br>
      .replace(/<p>\s*<\/p>/gi, '<br>');

    // Convert to Markdown
    let markdown = turndownService.turndown(normalizedHtml);

    // Post-process the Markdown to fix common issues
    markdown = markdown
      // Remove any backslash followed by a newline (common issue with turndown)
      .replace(/\\\n/g, '\n')
      // Remove any trailing backslashes at the end of lines
      .replace(/\\$/gm, '')
      // Normalize multiple consecutive blank lines to a maximum of two
      .replace(/\n{3,}/g, '\n\n')
      // Fix any escaped characters that shouldn't be escaped
      .replace(/\\([^\\`*_{}[\]()#+\-.!])/g, '$1');

    return markdown;
  } catch (error) {
    console.error('Error converting HTML to Markdown:', error);
    return 'Error converting to Markdown';
  }
}

/**
 * Get the approximate cursor position in Markdown from HTML position
 * This is a simplified approach and may not be perfect for all cases
 * @param {number} htmlPosition - Cursor position in HTML
 * @param {string} html - HTML content
 * @param {string} markdown - Markdown content
 * @returns {number} Approximate cursor position in Markdown
 */
export function getMarkdownCursorPosition(htmlPosition, html, markdown) {
  if (!html || !markdown) return 0;

  // Simple ratio-based approximation
  const ratio = markdown.length / html.length;
  return Math.min(Math.floor(htmlPosition * ratio), markdown.length);
}

/**
 * Get the approximate cursor position in HTML from Markdown position
 * This is a simplified approach and may not be perfect for all cases
 * @param {number} markdownPosition - Cursor position in Markdown
 * @param {string} markdown - Markdown content
 * @param {string} html - HTML content
 * @returns {number} Approximate cursor position in HTML
 */
export function getHtmlCursorPosition(markdownPosition, markdown, html) {
  if (!markdown || !html) return 0;

  // Simple ratio-based approximation
  const ratio = html.length / markdown.length;
  return Math.min(Math.floor(markdownPosition * ratio), html.length);
}
