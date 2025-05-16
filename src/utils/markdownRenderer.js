import hljs from 'highlight.js';
import { decodeHtmlEntities, escapeHtml } from './markdownUtils';

/**
 * A clean, reliable Markdown renderer that properly handles all edge cases
 */
class MarkdownRenderer {
  constructor(options = {}) {
    this.options = {
      highlightCode: true,
      escapeHtml: true,
      ...options
    };
  }

  /**
   * Renders Markdown content to HTML
   * @param {string} markdown - The markdown content to render
   * @returns {string} - The rendered HTML
   */
  render(markdown) {
    if (!markdown) return '';

    // Normalize line endings
    let text = markdown.replace(/\r\n/g, '\n');

    // Parse the markdown into tokens
    const tokens = this.tokenize(text);

    // Render the tokens to HTML
    return this.renderTokens(tokens);
  }

  /**
   * Tokenizes Markdown content into a structured representation
   * @param {string} markdown - The markdown content to tokenize
   * @returns {Array} - The tokenized markdown
   */
  tokenize(markdown) {
    const tokens = [];
    let lines = markdown.split('\n');
    let i = 0;

  /**
   * Parses list items with proper nesting
   * @param {Array} lines - All lines of the markdown content
   * @param {number} startLine - The line index to start parsing from
   * @param {number} baseIndentation - The indentation level of the parent list
   * @returns {Object} - The parsed list items and the next line index
   */
  this.parseListItems = (lines, startLine, baseIndentation) => {
    const items = [];
    let i = startLine;

    while (i < lines.length) {
      const line = lines[i];

      // Check if this is a list item at the current indentation level
      const itemMatch = line.match(/^(\s*)([-*]|\d+\.)\s+(.+)$/);

      if (itemMatch && itemMatch[1].length === baseIndentation) {
        // This is a list item at our level
        // Check if it's an ordered list item (number followed by period)
        const isOrdered = /^\d+\./.test(itemMatch[2]);
        const itemType = isOrdered ? 'ordered' : 'unordered';
        const itemContent = itemMatch[3];

        // Create a new item
        const item = {
          content: itemContent,
          type: itemType,
          children: []
        };

        // Move to the next line
        i++;

        // Check for nested content or nested lists
        let nestedContent = [];
        let hasNestedList = false;

        while (i < lines.length) {
          // Check if the next line is a nested list item
          const nestedMatch = lines[i].match(/^(\s*)([-*]|\d+\.)\s+(.+)$/);

          if (nestedMatch) {
            const nestedIndentation = nestedMatch[1].length;

            if (nestedIndentation > baseIndentation) {
              // This is a nested list
              hasNestedList = true;

              // Parse the nested list recursively
              const { items: nestedItems, nextLine } = this.parseListItems(lines, i, nestedIndentation);

              // Add the nested list to the current item
              const isOrderedNested = /^\d+\./.test(nestedMatch[2]);
              const nestedType = isOrderedNested ? 'ordered-list' : 'unordered-list';
              item.children.push({
                type: nestedType,
                items: nestedItems
              });

              // Update our position
              i = nextLine;
            } else {
              // This is a list item at our level or higher, so we're done with the current item
              break;
            }
          } else if (lines[i].trim() === '') {
            // Empty line - could be end of list or a separator between items
            i++;
          } else if (lines[i].match(new RegExp(`^\\s{${baseIndentation + 2},}\\S`))) {
            // This is a continuation of the current list item (indented text)
            // The +2 ensures it's more indented than the list marker
            nestedContent.push(lines[i].trim());
            i++;
          } else {
            // Not a list item or continuation - we're done with this item
            break;
          }
        }

        // If we collected nested content, add it to the item
        if (nestedContent.length > 0) {
          item.content += '\n' + nestedContent.join('\n');
        }

        // Add the item to our list
        items.push(item);
      } else {
        // Not a list item at our level, so we're done with this list
        break;
      }
    }

    return { items, nextLine: i };
  };

    while (i < lines.length) {
      const line = lines[i];

      // Skip empty lines
      if (line.trim() === '') {
        tokens.push({ type: 'empty', content: '' });
        i++;
        continue;
      }

      // Headers
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        tokens.push({
          type: 'header',
          level: headerMatch[1].length,
          content: headerMatch[2].trim()
        });
        i++;
        continue;
      }

      // Blockquotes
      if (line.startsWith('>')) {
        const blockquoteLines = [];
        let j = i;

        // Collect all consecutive blockquote lines
        while (j < lines.length && lines[j].startsWith('>')) {
          blockquoteLines.push(lines[j].substring(1).trim());
          j++;
        }

        tokens.push({
          type: 'blockquote',
          content: blockquoteLines.join('\n')
        });

        i = j;
        continue;
      }

      // Code blocks
      if (line.startsWith('```')) {
        const language = line.substring(3).trim();
        const codeLines = [];
        let j = i + 1;

        // Collect all lines until the closing ```
        while (j < lines.length && !lines[j].startsWith('```')) {
          codeLines.push(lines[j]);
          j++;
        }

        tokens.push({
          type: 'codeblock',
          language: language,
          content: codeLines.join('\n')
        });

        i = j + 1; // Skip the closing ```
        continue;
      }

      // Horizontal rule
      if (line.match(/^---+$/)) {
        tokens.push({ type: 'hr' });
        i++;
        continue;
      }

      // Lists (both ordered and unordered)
      const listMatch = line.match(/^(\s*)([-*]|\d+\.)\s+(.+)$/);
      if (listMatch) {
        const indentation = listMatch[1].length;
        // Check if it's an ordered list item (number followed by period)
        const isOrdered = /^\d+\./.test(listMatch[2]);
        const listType = isOrdered ? 'ordered' : 'unordered';

        // Parse the list structure with proper nesting
        const { items, nextLine } = this.parseListItems(lines, i, indentation);

        tokens.push({
          type: listType === 'ordered' ? 'ordered-list' : 'unordered-list',
          items: items
        });

        i = nextLine;
        continue;
      }

      // Tables
      if (line.includes('|')) {
        const tableLines = [];
        let j = i;

        // Collect all table lines
        while (j < lines.length && lines[j].includes('|')) {
          tableLines.push(lines[j]);
          j++;
        }

        // Only process as a table if we have at least 2 lines (header and separator)
        if (tableLines.length >= 2 && tableLines[1].match(/^\|?\s*[-:]+[-| :]*\|?$/)) {
          tokens.push({
            type: 'table',
            content: tableLines
          });

          i = j;
          continue;
        }
      }

      // Paragraphs (default)
      tokens.push({
        type: 'paragraph',
        content: line
      });

      i++;
    }

    return tokens;
  }

  /**
   * Renders tokenized markdown to HTML
   * @param {Array} tokens - The tokenized markdown
   * @returns {string} - The rendered HTML
   */
  renderTokens(tokens) {
    let html = '';
    let i = 0;

    while (i < tokens.length) {
      const token = tokens[i];

      switch (token.type) {
        case 'empty':
          html += '\n';
          break;

        case 'header':
          html += this.renderHeader(token);
          break;

        case 'blockquote':
          html += this.renderBlockquote(token);
          break;

        case 'codeblock':
          html += this.renderCodeBlock(token);
          break;

        case 'hr':
          html += '<hr class="md-hr">\n\n';
          break;

        case 'unordered-list':
          html += this.renderUnorderedList(token);
          break;

        case 'ordered-list':
          html += this.renderOrderedList(token);
          break;

        case 'table':
          html += this.renderTable(token);
          break;

        case 'paragraph':
          html += this.renderParagraph(token);
          break;
      }

      i++;
    }

    return html;
  }

  /**
   * Renders a header token to HTML
   * @param {Object} token - The header token
   * @returns {string} - The rendered HTML
   */
  renderHeader(token) {
    const level = token.level;
    const content = this.renderInline(token.content);
    const escapedText = content.toLowerCase().replace(/[^\w]+/g, '-');

    return `<h${level} id="${escapedText}" class="md-heading md-heading-${level}">${content}</h${level}>\n\n`;
  }

  /**
   * Renders a blockquote token to HTML
   * @param {Object} token - The blockquote token
   * @returns {string} - The rendered HTML
   */
  renderBlockquote(token) {
    // Process line breaks in blockquotes
    // Replace newlines with <br> tags to preserve line breaks
    let processedContent = token.content.replace(/\n/g, '<br>\n');

    // Render the content with inline formatting
    const content = this.renderInline(processedContent);

    return `<blockquote class="md-blockquote">${content}</blockquote>\n\n`;
  }

  /**
   * Renders a code block token to HTML
   * @param {Object} token - The code block token
   * @returns {string} - The rendered HTML
   */
  renderCodeBlock(token) {
    const language = token.language || 'plaintext';
    let code = token.content;

    // Decode HTML entities in the code
    code = decodeHtmlEntities(code);

    // Escape HTML in the code for security
    if (this.options.escapeHtml) {
      code = escapeHtml(code);
    }

    // Apply syntax highlighting if enabled
    let highlightedCode = code;
    if (this.options.highlightCode) {
      try {
        if (hljs.getLanguage(language)) {
          highlightedCode = hljs.highlight(code, { language }).value;
        }
      } catch (err) {
        console.warn('Error highlighting code:', err);
      }
    }

    return `<pre class="md-pre" data-language="${language}"><code class="md-code language-${language}">${highlightedCode}</code></pre>\n\n`;
  }

  /**
   * Renders an unordered list token to HTML
   * @param {Object} token - The unordered list token
   * @returns {string} - The rendered HTML
   */
  renderUnorderedList(token) {
    let html = '<ul class="md-list md-ul">\n';

    for (const item of token.items) {
      // Render the item content
      let itemHtml = this.renderInline(item.content);

      // Render any nested lists
      if (item.children && item.children.length > 0) {
        for (const child of item.children) {
          if (child.type === 'ordered-list') {
            itemHtml += this.renderOrderedList(child);
          } else if (child.type === 'unordered-list') {
            itemHtml += this.renderUnorderedList(child);
          }
        }
      }

      html += `<li class="md-list-item">${itemHtml}</li>\n`;
    }

    html += '</ul>\n\n';
    return html;
  }

  /**
   * Renders an ordered list token to HTML
   * @param {Object} token - The ordered list token
   * @returns {string} - The rendered HTML
   */
  renderOrderedList(token) {
    let html = '<ol class="md-list md-ol">\n';

    for (const item of token.items) {
      // Render the item content
      let itemHtml = this.renderInline(item.content);

      // Render any nested lists
      if (item.children && item.children.length > 0) {
        for (const child of item.children) {
          if (child.type === 'ordered-list') {
            itemHtml += this.renderOrderedList(child);
          } else if (child.type === 'unordered-list') {
            itemHtml += this.renderUnorderedList(child);
          }
        }
      }

      html += `<li class="md-list-item">${itemHtml}</li>\n`;
    }

    html += '</ol>\n\n';
    return html;
  }

  /**
   * Renders a table token to HTML
   * @param {Object} token - The table token
   * @returns {string} - The rendered HTML
   */
  renderTable(token) {
    const rows = token.content;

    // Parse header row
    const headerCells = rows[0].split('|')
      .filter(cell => cell.trim() !== '')
      .map(cell => cell.trim());

    // Parse separator row to determine alignment
    const separators = rows[1].split('|')
      .filter(cell => cell.trim() !== '')
      .map(cell => cell.trim());

    const alignments = separators.map(sep => {
      if (sep.startsWith(':') && sep.endsWith(':')) return 'center';
      if (sep.endsWith(':')) return 'right';
      return 'left';
    });

    // Build table HTML
    let html = '<table class="md-table">\n<thead>\n<tr>\n';

    // Add header cells
    headerCells.forEach((cell, index) => {
      const align = alignments[index] || 'left';
      html += `<th class="md-th" style="text-align: ${align}">${this.renderInline(cell)}</th>\n`;
    });

    html += '</tr>\n</thead>\n<tbody>\n';

    // Process data rows
    for (let i = 2; i < rows.length; i++) {
      const cells = rows[i].split('|')
        .filter(cell => cell.trim() !== '')
        .map(cell => cell.trim());

      html += '<tr>\n';
      cells.forEach((cell, index) => {
        const align = alignments[index] || 'left';
        html += `<td class="md-td" style="text-align: ${align}">${this.renderInline(cell)}</td>\n`;
      });
      html += '</tr>\n';
    }

    html += '</tbody>\n</table>\n\n';
    return html;
  }

  /**
   * Renders a paragraph token to HTML
   * @param {Object} token - The paragraph token
   * @returns {string} - The rendered HTML
   */
  renderParagraph(token) {
    const content = this.renderInline(token.content);
    return `<p class="md-paragraph">${content}</p>\n\n`;
  }

  /**
   * Renders inline markdown content to HTML
   * @param {string} text - The inline markdown content
   * @returns {string} - The rendered HTML
   */
  renderInline(text) {
    // Process line breaks
    text = text.replace(/  \n/g, '<br>\n');

    // Process images (must be done before links)
    text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
      // Clean the src URL
      const cleanSrc = src.trim();

      // Add a data attribute for relative paths
      const isRelative = cleanSrc.startsWith('./') || cleanSrc.startsWith('../');
      const dataAttr = isRelative ? ' data-relative-path="true"' : '';

      return `<img src="${cleanSrc}" alt="${alt}" class="md-image"${dataAttr}>`;
    });

    // Process links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, content, href) => {
      return `<a href="${href.trim()}" target="_blank" rel="noopener noreferrer" class="md-link">${content}</a>`;
    });

    // Process bold with asterisks or underscores
    text = text.replace(/(\*\*|__)(.*?)\1/g, '<strong class="md-strong">$2</strong>');

    // Process italic with asterisks
    text = text.replace(/\*(.*?)\*/g, '<em class="md-em">$1</em>');

    // Process italic with underscores (don't match inside words)
    text = text.replace(/(?<![a-zA-Z0-9])_(.*?)_(?![a-zA-Z0-9])/g, '<em class="md-em">$1</em>');

    // Process strikethrough
    text = text.replace(/~~(.*?)~~/g, '<del class="md-strikethrough">$1</del>');

    // Process inline code
    text = text.replace(/`([^`]+)`/g, (match, code) => {
      // Decode HTML entities in the code
      let processedCode = decodeHtmlEntities(code);

      // Escape HTML in the code for security
      if (this.options.escapeHtml) {
        processedCode = escapeHtml(processedCode);
      }

      return `<code class="md-inline-code">${processedCode}</code>`;
    });

    return text;
  }


}

export default MarkdownRenderer;
