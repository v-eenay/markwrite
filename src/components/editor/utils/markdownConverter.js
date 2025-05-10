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
  linkStyle: 'inlined'
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

/**
 * Convert Markdown to HTML
 * @param {string} markdown - Markdown content
 * @returns {string} HTML content
 */
export function markdownToHtml(markdown) {
  if (!markdown) return '';
  try {
    return marked.parse(markdown);
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
    return turndownService.turndown(html);
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
