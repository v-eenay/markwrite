import hljs from 'highlight.js';

/**
 * Enhanced markdown parser function
 * @param {string} markdown - The markdown content to parse
 * @param {Object} options - Options for the parser
 * @returns {string} - The parsed HTML
 */
export function parseMarkdown(markdown, options = {}) {
  if (!markdown) return '';
  
  // Default options
  const defaultOptions = {
    addLineBreaks: true,
    escapeHtml: true,
    highlightCode: true
  };
  
  const opts = { ...defaultOptions, ...options };
  
  // Normalize line endings and add a trailing newline to ensure proper parsing
  let text = markdown.replace(/\r\n/g, '\n') + '\n\n';
  
  // Process page breaks
  text = text.replace(/---pagebreak---/g, '<div class="page-break"></div>\n\n');
  
  // Pre-process multi-line blockquotes
  // First, identify blockquote sections
  let blockquoteRegex = /^(>.*(?:\n>.*)*)/gm;
  text = text.replace(blockquoteRegex, function(match) {
    // Remove the '>' prefix from each line and join with line breaks
    let content = match.replace(/^> ?/gm, '');
    // Return a single blockquote with all the content
    return `<blockquote class="md-blockquote">${content}</blockquote>\n\n`;
  });
  
  // Process tables
  // This regex identifies markdown tables with header, separator, and data rows
  const tableRegex = /^\|(.+)\|\s*\n\|(?:\s*[-:]+\s*\|)+\s*\n(\|(?:.+)\|\s*\n)+/gm;
  
  text = text.replace(tableRegex, function(match) {
    // Split the table into rows
    const rows = match.trim().split('\n');
    
    // Process header row
    const headerRow = rows[0];
    const headerCells = headerRow.split('|').slice(1, -1).map(cell => cell.trim());
    
    // Process separator row to determine alignment
    const separatorRow = rows[1];
    const alignments = separatorRow.split('|').slice(1, -1).map(cell => {
      const trimmed = cell.trim();
      if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center';
      if (trimmed.endsWith(':')) return 'right';
      return 'left';
    });
    
    // Build the table HTML
    let tableHtml = '<table class="md-table">\n<thead>\n<tr>\n';
    
    // Add header cells
    headerCells.forEach((cell, index) => {
      const align = alignments[index] || 'left';
      tableHtml += `<th class="md-th" style="text-align: ${align}">${cell}</th>\n`;
    });
    
    tableHtml += '</tr>\n</thead>\n<tbody>\n';
    
    // Process data rows
    for (let i = 2; i < rows.length; i++) {
      const row = rows[i];
      if (!row.trim()) continue;
      
      const cells = row.split('|').slice(1, -1).map(cell => cell.trim());
      
      tableHtml += '<tr>\n';
      cells.forEach((cell, index) => {
        const align = alignments[index] || 'left';
        tableHtml += `<td class="md-td" style="text-align: ${align}">${cell}</td>\n`;
      });
      tableHtml += '</tr>\n';
    }
    
    tableHtml += '</tbody>\n</table>\n\n';
    return tableHtml;
  });
  
  // Process headers
  text = text.replace(/^# (.*$)/gm, '<h1 class="md-heading md-heading-1">$1</h1>\n\n');
  text = text.replace(/^## (.*$)/gm, '<h2 class="md-heading md-heading-2">$1</h2>\n\n');
  text = text.replace(/^### (.*$)/gm, '<h3 class="md-heading md-heading-3">$1</h3>\n\n');
  text = text.replace(/^#### (.*$)/gm, '<h4 class="md-heading md-heading-4">$1</h4>\n\n');
  text = text.replace(/^##### (.*$)/gm, '<h5 class="md-heading md-heading-5">$1</h5>\n\n');
  text = text.replace(/^###### (.*$)/gm, '<h6 class="md-heading md-heading-6">$1</h6>\n\n');
  
  // Process code blocks with HTML escaping for security
  text = text.replace(/```([a-z]*)\n([\s\S]*?)```/g, function(match, language, code) {
    const validLanguage = language || 'plaintext';
    
    // Escape HTML in the code to prevent security issues
    let escapedCode = code;
    if (opts.escapeHtml) {
      escapedCode = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
    
    let highlightedCode = escapedCode;
    
    if (opts.highlightCode) {
      try {
        if (hljs.getLanguage(validLanguage)) {
          highlightedCode = hljs.highlight(escapedCode, { language: validLanguage }).value;
        }
      } catch (err) {
        console.warn('Error highlighting code:', err);
      }
    }
    
    return `<pre class="md-pre" data-language="${validLanguage}"><code class="md-code language-${validLanguage}">${highlightedCode}</code></pre>\n\n`;
  });
  
  // Process horizontal rules
  text = text.replace(/^---$/gm, '<hr class="md-hr">\n\n');
  
  // Process unordered lists
  let listItemRegex = /^(\s*)[\-\*] (.*?)$/gm;
  let listItems = [];
  let match;
  
  // Collect all list items with their indentation level
  while ((match = listItemRegex.exec(text)) !== null) {
    listItems.push({
      indentation: match[1].length,
      content: match[2],
      start: match.index,
      end: match.index + match[0].length
    });
  }
  
  // Process list items from end to start to avoid index shifting
  for (let i = listItems.length - 1; i >= 0; i--) {
    const item = listItems[i];
    text = text.substring(0, item.start) + 
           `<li class="md-list-item">${item.content}</li>` + 
           text.substring(item.end);
  }
  
  // Wrap list items in ul tags
  text = text.replace(/(<li class="md-list-item">.*?<\/li>)(?:\s*<li class="md-list-item">.*?<\/li>)*/gs, 
                     '<ul class="md-list md-ul">$&</ul>\n\n');
  
  // Process ordered lists
  let orderedListItemRegex = /^(\s*)\d+\. (.*?)$/gm;
  let orderedListItems = [];
  
  // Collect all ordered list items with their indentation level
  while ((match = orderedListItemRegex.exec(text)) !== null) {
    orderedListItems.push({
      indentation: match[1].length,
      content: match[2],
      start: match.index,
      end: match.index + match[0].length
    });
  }
  
  // Process ordered list items from end to start
  for (let i = orderedListItems.length - 1; i >= 0; i--) {
    const item = orderedListItems[i];
    text = text.substring(0, item.start) + 
           `<li class="md-list-item">${item.content}</li>` + 
           text.substring(item.end);
  }
  
  // Wrap ordered list items in ol tags
  text = text.replace(/(<li class="md-list-item">.*?<\/li>)(?:\s*<li class="md-list-item">.*?<\/li>)*/gs, 
                     '<ol class="md-list md-ol">$&</ol>\n\n');
  
  // Process emphasis (bold, italic, strikethrough)
  // Bold with asterisks or underscores
  text = text.replace(/(\*\*|__)(.*?)\1/g, '<strong class="md-strong">$2</strong>');
  
  // Italic with single asterisk or underscore, but don't match inside words for underscores
  text = text.replace(/\*(.*?)\*/g, '<em class="md-em">$1</em>');
  text = text.replace(/(?<![a-zA-Z0-9])_(.*?)_(?![a-zA-Z0-9])/g, '<em class="md-em">$1</em>');
  
  // Strikethrough
  text = text.replace(/~~(.*?)~~/g, '<del class="md-strikethrough">$1</del>');
  
  // Process inline code with HTML escaping for security
  text = text.replace(/`([^`]+)`/g, function(match, code) {
    // Escape HTML in the code to prevent security issues
    let escapedCode = code;
    if (opts.escapeHtml) {
      escapedCode = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
    
    return `<code class="md-inline-code">${escapedCode}</code>`;
  });
  
  // Process links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="md-link">$1</a>');
  
  // Process images - ensure proper rendering with correct attributes
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, function(match, alt, src) {
    // Clean the src URL if needed
    const cleanSrc = src.trim();
    // Create the image tag with proper attributes
    return `<img src="${cleanSrc}" alt="${alt}" class="md-image">\n\n`;
  });
  
  // Process line breaks within paragraphs (before paragraph processing)
  // Convert explicit line breaks (two spaces followed by newline)
  text = text.replace(/  \n/g, '<br>\n');
  
  // Process paragraphs (must be done last)
  // First, split by double newlines to identify paragraph blocks
  const blocks = text.split(/\n\n+/);
  let processedBlocks = [];
  
  for (let block of blocks) {
    const trimmedBlock = block.trim();
    // Skip empty blocks
    if (!trimmedBlock) continue;
    
    // Skip blocks that are already HTML elements
    if (trimmedBlock.startsWith('<') && 
        !trimmedBlock.startsWith('<code') && 
        !trimmedBlock.startsWith('<a ') && 
        !trimmedBlock.startsWith('<strong') && 
        !trimmedBlock.startsWith('<em') && 
        !trimmedBlock.startsWith('<del')) {
      processedBlocks.push(trimmedBlock);
    }
    // Process plain text as paragraphs
    else {
      processedBlocks.push(`<p class="md-paragraph">${trimmedBlock}</p>`);
    }
  }
  
  // Join blocks with proper spacing
  text = processedBlocks.join('\n\n');
  
  // Clean up any empty paragraphs
  text = text.replace(/<p class="md-paragraph"><\/p>/g, '');
  
  // Ensure proper spacing between block elements
  text = text.replace(/(<\/h[1-6]>|<\/blockquote>|<\/pre>|<\/table>|<\/ul>|<\/ol>|<\/p>)(<[^\/])/g, '$1\n\n$2');
  
  // Clean up excessive newlines
  text = text.replace(/\n{3,}/g, '\n\n');
  
  return text;
}
