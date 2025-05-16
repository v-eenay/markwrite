import { useState } from 'react';
import { marked } from 'marked';
import PreviewModal from '../PreviewModal/PreviewModal';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import PdfIcon from '../icons/PdfIcon';
import { useTheme } from '../../contexts/ThemeContext';
import hljs from 'highlight.js';
import { parseMarkdown } from '../../utils/markdownParser';

/**
 * PdfDownloadButton Component
 * Provides functionality to generate and download PDF from markdown content
 * Completely refactored to address all requirements
 */
function PdfDownloadButton({ markdown, previewRef }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const { theme } = useTheme();

  /**
   * Creates a custom Markdown renderer for PDF export
   * @returns {marked.Renderer} A custom renderer for PDF export
   */
  const createPdfRenderer = () => {
    const renderer = new marked.Renderer();

    /**
     * Helper function to safely extract text from potentially complex objects
     * @param {*} input - The input to extract text from
     * @returns {string} - The extracted text
     */
    const extractText = (input) => {
      // If it's null or undefined, return empty string
      if (input == null) {
        return '';
      }

      // If it's a string, return it directly
      if (typeof input === 'string') {
        return input;
      }

      // If it's an object, try to extract text
      if (typeof input === 'object') {
        // If it has a text property, use that
        if (input.text) {
          return typeof input.text === 'string' ? input.text : extractText(input.text);
        }

        // If it has a raw property, use that
        if (input.raw) {
          return typeof input.raw === 'string' ? input.raw : extractText(input.raw);
        }

        // If it has tokens, extract text from them
        if (Array.isArray(input.tokens)) {
          return input.tokens.map(token => {
            if (token.text) return token.text;
            if (token.raw) return token.raw;
            return '';
          }).join('');
        }

        // Try to convert to JSON string if it's not a complex object
        try {
          const jsonStr = JSON.stringify(input);
          if (jsonStr !== '[object Object]' && !jsonStr.includes('"type":')) {
            return jsonStr.replace(/"/g, '');
          }
        } catch (e) {
          // Ignore JSON stringify errors
        }
      }

      // If it's an array, join the elements
      if (Array.isArray(input)) {
        return input.map(item => extractText(item)).join('');
      }

      // Last resort: convert to string
      const str = String(input);
      return str === '[object Object]' ? '' : str;
    };

    // Custom heading renderer
    renderer.heading = (text, level) => {
      const safeText = extractText(text);
      return `<h${level} class="pdf-heading pdf-heading-${level}">${safeText}</h${level}>`;
    };

    // Custom paragraph renderer
    renderer.paragraph = (text) => {
      const safeText = extractText(text);
      return `<p class="pdf-paragraph">${safeText}</p>`;
    };

    // Custom code block renderer
    renderer.code = (code, language) => {
      const safeCode = extractText(code);
      let highlightedCode = safeCode;

      // Apply syntax highlighting if language is specified
      if (language && hljs.getLanguage(language)) {
        try {
          highlightedCode = hljs.highlight(safeCode, { language }).value;
        } catch (err) {
          console.error('Error highlighting code:', err);
        }
      }

      return `
        <pre class="pdf-pre">
          <code class="pdf-code ${language ? `language-${language}` : ''}">${highlightedCode}</code>
        </pre>
      `;
    };

    // Custom inline code renderer
    renderer.codespan = (code) => {
      const safeCode = extractText(code);
      return `<code class="pdf-inline-code">${safeCode}</code>`;
    };

    // Custom list renderer
    renderer.list = (body, ordered) => {
      const safeBody = extractText(body);
      const type = ordered ? 'ol' : 'ul';
      return `<${type} class="pdf-list pdf-${type}">${safeBody}</${type}>`;
    };

    // Custom list item renderer
    renderer.listitem = (text) => {
      const safeText = extractText(text);
      return `<li class="pdf-list-item">${safeText}</li>`;
    };

    // Custom blockquote renderer
    renderer.blockquote = (quote) => {
      const safeQuote = extractText(quote);
      return `<blockquote class="pdf-blockquote">${safeQuote}</blockquote>`;
    };

    // Custom table renderer
    renderer.table = (header, body) => {
      const safeHeader = extractText(header);
      const safeBody = extractText(body);
      return `
        <table class="pdf-table">
          <thead class="pdf-thead">${safeHeader}</thead>
          <tbody class="pdf-tbody">${safeBody}</tbody>
        </table>
      `;
    };

    // Custom table row renderer
    renderer.tablerow = (content) => {
      const safeContent = extractText(content);
      return `<tr class="pdf-tr">${safeContent}</tr>`;
    };

    // Custom table cell renderer
    renderer.tablecell = (content, options) => {
      const safeContent = extractText(content);
      const header = options && options.header;
      const align = options && options.align;

      const type = header ? 'th' : 'td';
      const alignClass = align ? `pdf-text-${align}` : '';
      return `<${type} class="pdf-${type} ${alignClass}">${safeContent}</${type}>`;
    };

    // Custom link renderer
    renderer.link = (href, title, text) => {
      const safeHref = extractText(href);
      const safeTitle = extractText(title);
      const safeText = extractText(text);

      const titleAttr = safeTitle ? `title="${safeTitle}"` : '';
      return `<a class="pdf-link" href="${safeHref}" ${titleAttr}>${safeText}</a>`;
    };

    // Custom image renderer
    renderer.image = (href, title, text) => {
      const safeHref = extractText(href);
      const safeTitle = extractText(title);
      const safeText = extractText(text);

      const titleAttr = safeTitle ? `title="${safeTitle}"` : '';
      return `<img class="pdf-image" src="${safeHref}" alt="${safeText}" ${titleAttr}>`;
    };

    // Custom strong text renderer
    renderer.strong = (text) => {
      const safeText = extractText(text);
      return `<strong class="pdf-strong">${safeText}</strong>`;
    };

    // Custom emphasized text renderer
    renderer.em = (text) => {
      const safeText = extractText(text);
      return `<em class="pdf-em">${safeText}</em>`;
    };

    // Custom strikethrough renderer
    renderer.del = (text) => {
      const safeText = extractText(text);
      return `<del class="pdf-del">${safeText}</del>`;
    };

    // Custom horizontal rule renderer
    renderer.hr = () => {
      return `<hr class="pdf-hr">`;
    };

    return renderer;
  };

  /**
   * Extracts a filename from the markdown content
   * Uses the first heading if available, otherwise uses a default name
   * @returns {string} The PDF filename
   */
  const getFilename = () => {
    // Try to extract the first heading from markdown
    const headingMatch = markdown.match(/^# (.+)$/m);
    if (headingMatch && headingMatch[1]) {
      // Clean the heading to make it suitable for a filename
      return `${headingMatch[1].replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`;
    }
    return 'markwrite-document.pdf';
  };

  /**
   * Applies theme transformations to ensure consistent rendering in PDF
   * @param {HTMLElement} element - The element to transform
   */
  const applyThemeTransformations = (element) => {
    console.log('Applying theme transformations for PDF export');

    try {
      // Remove dark mode classes but preserve the content
      if (element.classList) {
        element.classList.remove('dark');
        element.classList.remove('dark-preview');
        element.classList.remove('dark-theme');
      }

      // Remove any dark mode specific classes that might affect rendering
      const darkElements = element.querySelectorAll('.dark, .dark-preview, .dark-theme');
      darkElements.forEach(el => {
        if (el.classList) {
          el.classList.remove('dark');
          el.classList.remove('dark-preview');
          el.classList.remove('dark-theme');
        }
      });

      // Transform dark mode specific Tailwind classes
      const darkModeElements = element.querySelectorAll('[class*="dark:"]');
      darkModeElements.forEach(el => {
        if (el.classList) {
          Array.from(el.classList).forEach(className => {
            if (className.startsWith('dark:')) {
              el.classList.remove(className);
            }
          });
        }
      });

      // Apply explicit light mode styling to all elements
      element.style.backgroundColor = '#ffffff';
      element.style.color = '#333333';

      // Make sure all elements are visible
      const allElements = element.querySelectorAll('*');
      allElements.forEach(el => {
        if (el.style) {
          // Don't override display for elements that should be hidden
          if (!el.classList || !el.classList.contains('pagebreak')) {
            el.style.display = '';
          }
          el.style.visibility = 'visible';
          el.style.opacity = '1';
        }
      });

      // Fix all headings
      const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
      headings.forEach(heading => {
        heading.style.color = '#2f3e46';
        heading.style.fontWeight = '600';
        heading.style.pageBreakAfter = 'avoid';
        heading.style.breakAfter = 'avoid';
        heading.style.marginTop = '1.2em';
        heading.style.marginBottom = '0.6em';
      });

      // Fix code blocks with dark theme syntax highlighting
      const codeBlocks = element.querySelectorAll('pre code');
      codeBlocks.forEach(codeBlock => {
        // Remove dark theme classes
        if (codeBlock.classList) {
          codeBlock.classList.remove('dark-theme');
          codeBlock.classList.remove('hljs-dark');

          // Remove any syntax highlighting classes that might interfere
          const syntaxClasses = Array.from(codeBlock.classList).filter(cls =>
            cls.startsWith('language-') || cls.startsWith('hljs-')
          );

          syntaxClasses.forEach(cls => {
            // Keep the language class but remove any theme-specific classes
            if (!cls.startsWith('language-')) {
              codeBlock.classList.remove(cls);
            }
          });
        }

        // Apply consistent styling for code blocks
        if (codeBlock.parentElement) {
          // Ensure high contrast for code blocks
          codeBlock.parentElement.style.backgroundColor = '#f8f9fa';
          codeBlock.parentElement.style.color = '#333';
          codeBlock.parentElement.style.border = '1px solid #e9ecef';
          codeBlock.parentElement.style.borderRadius = '6px';
          codeBlock.parentElement.style.padding = '1em';
          codeBlock.parentElement.style.margin = '1em 0';
          codeBlock.parentElement.style.pageBreakInside = 'avoid';
          codeBlock.parentElement.style.breakInside = 'avoid';
          codeBlock.parentElement.style.overflow = 'visible'; // Ensure content is visible

          // Apply explicit styling to the code element itself
          codeBlock.style.backgroundColor = 'transparent';
          codeBlock.style.color = '#333';
          codeBlock.style.fontFamily = 'Courier New, Courier, monospace';
          codeBlock.style.fontSize = '0.9em';
          codeBlock.style.lineHeight = '1.5';
          codeBlock.style.whiteSpace = 'pre-wrap'; // Allow wrapping for better PDF rendering
          codeBlock.style.wordBreak = 'break-word';
        }
      });

      // Fix all links to have a consistent style
      const links = element.querySelectorAll('a');
      links.forEach(link => {
        link.style.color = '#0366d6';
        link.style.textDecoration = 'underline';
      });

      // Fix all paragraphs
      const paragraphs = element.querySelectorAll('p');
      paragraphs.forEach(p => {
        p.style.marginBottom = '0.8em';
        p.style.marginTop = '0';
        p.style.color = '#333';
        p.style.lineHeight = '1.6';
      });

      // Fix all lists
      const lists = element.querySelectorAll('ul, ol');
      lists.forEach(list => {
        list.style.paddingLeft = '2em';
        list.style.margin = '1em 0';
      });

      // Fix all list items
      const listItems = element.querySelectorAll('li');
      listItems.forEach(item => {
        item.style.marginBottom = '0.5em';
      });

      // Fix all tables
      const tables = element.querySelectorAll('table');
      tables.forEach(table => {
        table.style.borderCollapse = 'collapse';
        table.style.width = '100%';
        table.style.margin = '1em 0';
        table.style.border = '1px solid #e5e7eb';
      });

      // Fix all table cells
      const tableCells = element.querySelectorAll('th, td');
      tableCells.forEach(cell => {
        cell.style.border = '1px solid #ddd';
        cell.style.padding = '8px';
        cell.style.textAlign = 'left';
      });

      // Fix all images
      const images = element.querySelectorAll('img');
      images.forEach(img => {
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.display = 'block';
        img.style.margin = '1em auto';
      });

      // Fix all blockquotes
      const blockquotes = element.querySelectorAll('blockquote');
      blockquotes.forEach(blockquote => {
        blockquote.style.borderLeft = '4px solid #6b7280';
        blockquote.style.padding = '0.5em 1em';
        blockquote.style.margin = '1em 0';
        blockquote.style.backgroundColor = '#f9fafb';
        blockquote.style.color = '#4b5563';
        blockquote.style.fontStyle = 'italic';
      });
    } catch (err) {
      console.error('Error during theme transformation:', err);
    }
  };

  /**
   * Processes inline code elements for better PDF rendering
   * @param {HTMLElement} element - The element containing inline code
   */
  const processInlineCode = (element) => {
    const inlineCodeElements = element.querySelectorAll('code:not(pre code)');
    inlineCodeElements.forEach(codeElement => {
      // Add a special class for styling
      codeElement.classList.add('pdf-inline-code');

      // Clean up content if needed
      let codeContent = codeElement.textContent || '';
      codeContent = codeContent.replace(/`/g, '').trim();

      // Apply explicit styling to ensure proper rendering
      codeElement.style.fontFamily = 'Courier New, Courier, monospace';
      codeElement.style.fontSize = '0.9em';
      codeElement.style.color = '#d63384';
      codeElement.style.backgroundColor = 'rgba(214, 51, 132, 0.05)';
      codeElement.style.borderRadius = '3px';
      codeElement.style.border = '1px solid rgba(214, 51, 132, 0.1)';
      codeElement.style.padding = '0.1em 0.4em';
      codeElement.style.display = 'inline-block';
      codeElement.style.whiteSpace = 'normal';
      codeElement.style.wordWrap = 'break-word';

      // Update content if needed
      if (codeContent !== codeElement.textContent) {
        codeElement.textContent = codeContent;
      }
    });
  };

  /**
   * Processes tables for better PDF rendering
   * @param {HTMLElement} element - The element containing tables
   */
  const processTables = (element) => {
    const tables = element.querySelectorAll('table');
    tables.forEach(table => {
      table.style.tableLayout = 'fixed';
      table.style.width = '100%';
      table.style.pageBreakInside = 'avoid';
      table.style.breakInside = 'avoid';
      table.style.borderCollapse = 'collapse';
      table.style.border = '1px solid #e5e7eb';
      table.style.margin = '1em 0';

      // Get the number of columns
      const headerRow = table.querySelector('tr');
      if (headerRow) {
        const columnCount = headerRow.cells.length;
        if (columnCount > 0) {
          // Set equal width for all columns
          const width = `${100 / columnCount}%`;
          Array.from(table.querySelectorAll('th, td')).forEach(cell => {
            cell.style.width = width;
            cell.style.wordWrap = 'break-word';
            cell.style.overflowWrap = 'break-word';
            cell.style.border = '1px solid #ddd';
            cell.style.padding = '8px';
            cell.style.textAlign = 'left';
          });

          // Style header cells
          Array.from(table.querySelectorAll('th')).forEach(th => {
            th.style.backgroundColor = '#f2f2f2';
            th.style.fontWeight = '600';
          });

          // Style even rows
          const rows = table.querySelectorAll('tr');
          rows.forEach((row, index) => {
            if (index % 2 === 1) { // Even rows (0-indexed)
              row.style.backgroundColor = '#f9fafb';
            }
          });
        }
      }
    });
  };

  /**
   * Processes blockquotes for better PDF rendering
   * @param {HTMLElement} element - The element containing blockquotes
   */
  const processBlockquotes = (element) => {
    const blockquotes = element.querySelectorAll('blockquote');
    blockquotes.forEach(blockquote => {
      blockquote.style.borderLeft = '4px solid #6b7280';
      blockquote.style.padding = '0.5em 1em';
      blockquote.style.margin = '1em 0';
      blockquote.style.backgroundColor = '#f9fafb';
      blockquote.style.color = '#4b5563';
      blockquote.style.fontStyle = 'italic';
      blockquote.style.display = 'block';
      blockquote.style.pageBreakInside = 'avoid';
      blockquote.style.breakInside = 'avoid';

      // Make sure nested paragraphs are properly styled
      const paragraphs = blockquote.querySelectorAll('p');
      paragraphs.forEach(p => {
        p.style.margin = '0.5em 0';
        p.style.textAlign = 'left';
      });
    });
  };

  /**
   * Processes page breaks for PDF rendering
   * @param {HTMLElement} element - The element to process
   */
  const processPageBreaks = (element) => {
    // First, find any existing page-break divs and convert them
    const pageBreakDivs = element.querySelectorAll('.page-break');
    pageBreakDivs.forEach(div => {
      div.className = 'pagebreak';
      div.style.pageBreakAfter = 'always';
      div.style.breakAfter = 'page';
      div.style.height = '0';
      div.style.display = 'block';
      div.style.visibility = 'hidden';
    });

    // Also check for any remaining ---pagebreak--- markers in the content
    const contentHtml = element.innerHTML;
    if (contentHtml.includes('---pagebreak---')) {
      element.innerHTML = contentHtml.replace(/---pagebreak---/g, '<div class="pagebreak" style="page-break-after: always; break-after: page; height: 0; display: block; visibility: hidden;"></div>');
    }
  };

  /**
   * Process JSON content in code blocks
   * @param {HTMLElement} element - The element containing code blocks
   */
  const processJsonContent = (element) => {
    const codeElements = element.querySelectorAll('code');
    const jsonPattern = /^\s*\{.*\}\s*$/s; // Pattern to detect JSON-like content

    codeElements.forEach(codeElement => {
      const textContent = codeElement.textContent || '';

      if (jsonPattern.test(textContent) || textContent.includes('[object Object]')) {
        let cleanContent = textContent;

        if (jsonPattern.test(textContent)) {
          try {
            // Try to parse as JSON
            const jsonObj = JSON.parse(textContent);
            if (jsonObj.text) {
              cleanContent = jsonObj.text;
            } else if (jsonObj.raw) {
              // Remove the backticks if present
              cleanContent = jsonObj.raw.replace(/^`|`$/g, '');
            } else if (Array.isArray(jsonObj.tokens)) {
              // Extract text from tokens
              cleanContent = jsonObj.tokens.map(token => {
                return token.text || token.raw || '';
              }).join('');
            } else {
              // Fallback: remove the JSON structure
              cleanContent = textContent.replace(/\{.*\}/g, '').trim();
            }
          } catch (e) {
            // If JSON parsing fails, just clean up the text
            cleanContent = textContent
              .replace(/\[object Object\]/g, '')
              .replace(/\{.*\}/g, '')
              .replace(/["{}]/g, '')
              .trim();
          }
        } else if (textContent.includes('[object Object]')) {
          // Handle [object Object] contamination
          cleanContent = textContent.replace(/\[object Object\]/g, '').trim();
        }

        // Remove backticks that might be showing in the rendered output
        cleanContent = cleanContent.replace(/`/g, '');

        // Replace HTML entities that might be causing display issues
        cleanContent = cleanContent.replace(/&lt;/g, '<').replace(/&gt;/g, '>');

        // Update the code element content
        codeElement.textContent = cleanContent;
      }
    });
  };

  /**
   * Returns the CSS styles to be applied to the PDF document
   * @returns {string} CSS styles as a string
   */
  /**
   * Parses Markdown content directly for PDF generation
   * @param {string} markdownContent - The markdown content to parse
   * @returns {string} The HTML content for PDF generation
   */
  const parseMarkdownForPdf = (markdownContent) => {
    // Ensure markdownContent is a string
    if (typeof markdownContent !== 'string') {
      console.warn('markdownContent is not a string, converting to string');
      markdownContent = String(markdownContent || '');
    }

    try {
      // Process page breaks first
      const processedMarkdown = markdownContent.replace(/---pagebreak---/g, '\n\n<div class="pagebreak"></div>\n\n');

      // Use our shared markdown parser with PDF-specific options
      const html = parseMarkdown(processedMarkdown, {
        addLineBreaks: true,
        escapeHtml: true,
        highlightCode: true
      });

      // Final cleanup to remove any remaining [object Object] instances
      const cleanedHtml = html.replace(/\[object Object\]/g, '')
                              .replace(/undefined/g, '')
                              .replace(/\{\}/g, '');

      // Check if the HTML contains actual formatted content
      // If it's just raw markdown, try an alternative approach with marked
      if (cleanedHtml.includes('# ') || cleanedHtml.includes('## ') ||
          cleanedHtml.includes('![') || cleanedHtml.includes('```')) {
        console.warn('HTML output contains raw markdown, trying alternative parsing approach');

        // Configure marked with custom renderer and options
        const renderer = createPdfRenderer();

        // Add a walkTokens function to ensure all tokens have proper text representation
        const walkTokens = function(token) {
          // Handle token.text that might be an object
          if (token.text && typeof token.text === 'object') {
            // Try to extract text from the object
            if (token.text.text) {
              token.text = token.text.text;
            } else if (token.text.raw) {
              token.text = token.text.raw;
            } else if (Array.isArray(token.text.tokens)) {
              token.text = token.text.tokens.map(t => t.text || t.raw || '').join('');
            } else {
              // Convert to string but avoid [object Object]
              const str = String(token.text);
              token.text = str === '[object Object]' ? '' : str;
            }
          }

          // Handle token.tokens that might contain objects with text properties
          if (Array.isArray(token.tokens)) {
            token.tokens.forEach(walkTokens);
          }
        };

        // Reset marked to ensure clean configuration
        marked.setOptions({});

        // Apply our custom configuration
        marked.use({ renderer });

        // Try using the default renderer with our custom options
        const defaultRenderer = new marked.Renderer();
        const alternativeHtml = marked.parse(processedMarkdown, {
          renderer: defaultRenderer,
          breaks: true,
          gfm: true,
          headerIds: true,
          mangle: false,
          sanitize: false,
          smartLists: true,
          smartypants: true,
          walkTokens: walkTokens
        });

        return alternativeHtml.replace(/\[object Object\]/g, '')
                             .replace(/undefined/g, '')
                             .replace(/\{\}/g, '');
      }

      return cleanedHtml;
    } catch (error) {
      console.error('Error parsing markdown for PDF:', error);
      // Fallback to a simpler parsing approach
      try {
        // Reset marked to ensure clean configuration
        marked.setOptions({});

        // Process page breaks first
        const processedMarkdown = markdownContent.replace(/---pagebreak---/g, '\n\n<div class="pagebreak"></div>\n\n');

        return marked.parse(processedMarkdown, {
          breaks: true,
          gfm: true,
          sanitize: false // Don't sanitize to preserve HTML
        });
      } catch (fallbackError) {
        console.error('Fallback parsing also failed:', fallbackError);
        // Ultra fallback: just escape the markdown and wrap in pre
        return `<pre>${markdownContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;
      }
    }
  };

  const getPdfStyles = () => {
    return `
      @page {
        margin: 15mm;
        size: A4;
      }
      body {
        font-family: 'Arial', 'Helvetica', sans-serif;
        line-height: 1.6;
        color: #333;
        background-color: #fff;
        font-size: 11pt;
        margin: 0;
        padding: 0;
      }
      /* Headings */
      .pdf-heading, h1, h2, h3, h4, h5, h6 {
        margin-top: 1.2em;
        margin-bottom: 0.6em;
        page-break-after: avoid;
        break-after: avoid;
        color: #2f3e46;
        font-weight: 600;
        line-height: 1.3;
      }
      .pdf-heading-1, h1 {
        font-size: 2em;
        border-bottom: 1px solid #eaecef;
        padding-bottom: 0.3em;
      }
      .pdf-heading-2, h2 {
        font-size: 1.5em;
        border-bottom: 1px solid #eaecef;
        padding-bottom: 0.3em;
      }
      .pdf-heading-3, h3 { font-size: 1.25em; }
      .pdf-heading-4, h4 { font-size: 1em; }
      .pdf-heading-5, h5 { font-size: 0.875em; }
      .pdf-heading-6, h6 { font-size: 0.85em; color: #57606a; }

      /* Paragraphs */
      .pdf-paragraph, p {
        margin-bottom: 0.8em;
        margin-top: 0;
        text-align: justify;
        color: #333;
        line-height: 1.6;
      }

      /* Text formatting */
      .pdf-strong, strong, b {
        font-weight: 600;
        color: #24292e;
      }
      .pdf-em, em, i {
        font-style: italic;
      }

      /* Strikethrough */
      .pdf-del, del, s {
        text-decoration: line-through;
        color: #666;
        /* Fix for strikethrough alignment */
        text-decoration-thickness: 0.5px;
        text-decoration-skip-ink: none;
      }

      /* Inline code */
      .pdf-inline-code, code:not(pre code) {
        font-family: 'Courier New', Courier, monospace;
        font-size: 0.9em;
        color: #d63384;
        background-color: rgba(214, 51, 132, 0.05);
        border-radius: 3px;
        border: 1px solid rgba(214, 51, 132, 0.1);
        padding: 0.1em 0.4em;
        white-space: normal;
        word-wrap: break-word;
        /* Fix for inline code alignment */
        display: inline-block;
        line-height: 1.2;
        vertical-align: baseline;
      }

      /* Code blocks */
      .pdf-pre, pre {
        background-color: #f8f9fa;
        border-radius: 6px;
        padding: 1em;
        margin: 1em 0;
        overflow-x: auto;
        border: 1px solid #e9ecef;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        page-break-inside: avoid;
        break-inside: avoid;
        white-space: pre-wrap;
      }
      .pdf-code, pre code {
        padding: 0;
        background-color: transparent;
        border-radius: 0;
        display: block;
        white-space: pre-wrap;
        color: #333;
        font-size: 0.9em;
        border: none;
        font-weight: normal;
        font-family: 'Courier New', Courier, monospace;
        line-height: 1.5;
        overflow-wrap: break-word;
        word-wrap: break-word;
      }

      /* Syntax highlighting */
      .hljs-keyword, .hljs-selector-tag, .hljs-addition { color: #0550ae; font-weight: bold; }
      .hljs-number, .hljs-string, .hljs-meta .hljs-meta-string, .hljs-literal, .hljs-doctag, .hljs-regexp { color: #2e7d32; }
      .hljs-title, .hljs-section, .hljs-name, .hljs-selector-id, .hljs-selector-class { color: #d32f2f; }
      .hljs-attribute, .hljs-attr, .hljs-variable, .hljs-template-variable, .hljs-class .hljs-title, .hljs-type { color: #e65100; }
      .hljs-symbol, .hljs-bullet, .hljs-subst, .hljs-meta, .hljs-meta .hljs-keyword, .hljs-selector-attr, .hljs-selector-pseudo, .hljs-link { color: #7b1fa2; }
      .hljs-built_in, .hljs-deletion { color: #0277bd; }
      .hljs-comment, .hljs-quote { color: #5d6c79; font-style: italic; }

      /* Images */
      .pdf-image, img {
        max-width: 100%;
        height: auto;
        display: block;
        margin: 1em auto;
        page-break-inside: avoid;
        break-inside: avoid;
        border-radius: 4px;
      }

      /* Lists */
      .pdf-list, .pdf-ul, .pdf-ol, ul, ol {
        padding-left: 2em;
        margin: 1em 0;
      }
      .pdf-list-item, li {
        margin-bottom: 0.5em;
        line-height: 1.6;
        /* Fix for list item alignment */
        padding-left: 0.5em;
      }
      .pdf-list-item > .pdf-list, li > ul, li > ol {
        margin: 0.5em 0;
      }
      /* Fix for list marker alignment */
      li::marker {
        vertical-align: baseline;
      }

      /* Unordered lists */
      ul {
        list-style-type: disc;
      }
      ul ul {
        list-style-type: circle;
      }
      ul ul ul {
        list-style-type: square;
      }

      /* Ordered lists */
      ol {
        list-style-type: decimal;
      }
      ol ol {
        list-style-type: lower-alpha;
      }
      ol ol ol {
        list-style-type: lower-roman;
      }

      /* Blockquotes */
      .pdf-blockquote, blockquote {
        border-left: 4px solid #6b7280;
        padding: 0.5em 1em;
        margin: 1em 0;
        background-color: #f9fafb;
        color: #4b5563;
        font-style: italic;
        display: block;
        page-break-inside: avoid;
        break-inside: avoid;
        /* Fix for blockquote alignment */
        box-sizing: border-box;
      }
      .pdf-blockquote p, blockquote p {
        margin: 0.5em 0;
        text-align: left;
        /* Fix for paragraph alignment in blockquotes */
        line-height: 1.6;
      }

      /* Tables */
      .pdf-table, table {
        border-collapse: collapse;
        width: 100%;
        margin: 1em 0;
        border: 1px solid #e5e7eb;
        page-break-inside: avoid;
        break-inside: avoid;
        table-layout: fixed;
      }
      .pdf-th, .pdf-td, th, td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
        word-wrap: break-word;
        overflow-wrap: break-word;
        vertical-align: top;
      }
      .pdf-th, th {
        background-color: #f2f2f2;
        font-weight: 600;
      }
      .pdf-tr:nth-child(even), tr:nth-child(even) {
        background-color: #f9fafb;
      }

      /* Table captions */
      table caption {
        font-style: italic;
        text-align: center;
        margin-bottom: 0.5em;
        color: #666;
      }

      /* Text alignment */
      .pdf-text-left { text-align: left; }
      .pdf-text-center { text-align: center; }
      .pdf-text-right { text-align: right; }

      /* Page breaks */
      .pagebreak, .page-break {
        page-break-after: always;
        break-after: page;
        height: 0;
        display: block;
        visibility: hidden;
      }

      /* Horizontal rule */
      .pdf-hr, hr {
        border: 0;
        border-top: 1px solid #eaecef;
        margin: 1.5em 0;
        height: 1px;
        /* Fix for horizontal rule alignment */
        display: block;
        clear: both;
        background-color: #eaecef;
      }

      /* Links */
      .pdf-link, a {
        color: #0366d6;
        text-decoration: underline;
      }

      /* Task lists */
      .task-list-item {
        list-style-type: none;
        margin-left: -1.5em;
        position: relative;
      }
      .task-list-item input[type="checkbox"] {
        margin-right: 0.5em;
      }
      .pdf-checkbox {
        display: inline-block;
        width: 1.2em;
        height: 1.2em;
        margin-right: 0.5em;
        font-family: sans-serif;
        font-size: 1.1em;
        line-height: 1;
        vertical-align: middle;
        color: #333;
      }
      .pdf-checkbox-checked {
        color: #2563eb;
      }
      .pdf-checkbox-unchecked {
        color: #6b7280;
      }

      /* Definition lists */
      dl, .pdf-dl {
        margin: 1em 0;
        padding: 0.5em;
        border-left: 3px solid #e5e7eb;
        background-color: #f9fafb;
      }
      dt, .pdf-dt {
        font-weight: bold;
        margin-top: 0.5em;
        color: #2f3e46;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 0.2em;
      }
      dd, .pdf-dd {
        margin-left: 2em;
        margin-bottom: 0.8em;
        padding-left: 0.5em;
        color: #4b5563;
      }

      /* Footnotes */
      .footnote, .pdf-footnote-ref {
        font-size: 0.8em;
        color: #666;
        vertical-align: super;
        text-decoration: none;
      }
      .pdf-footnote-sup {
        vertical-align: super;
        font-size: 0.8em;
        color: #2563eb;
        font-weight: bold;
      }
      .footnotes, .pdf-footnotes {
        border-top: 1px solid #eaecef;
        margin-top: 2em;
        padding-top: 1em;
        background-color: #f9fafb;
        padding: 1em;
        border-radius: 4px;
      }
      .footnotes ol, .pdf-footnote-list {
        font-size: 0.9em;
        color: #666;
        padding-left: 1.5em;
      }
      .pdf-footnote-item {
        margin-bottom: 0.5em;
        line-height: 1.4;
      }

      /* Code block language label */
      pre::before {
        content: attr(data-language);
        display: block;
        font-size: 0.7em;
        color: #999;
        margin-bottom: 0.5em;
        text-transform: uppercase;
      }
    `;
  };

  /**
   * Safely removes an element from the DOM
   * @param {HTMLElement} element - The element to remove
   * @returns {boolean} - Whether the element was successfully removed
   */
  const safeRemove = (element) => {
    try {
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
        return true;
      }
    } catch (e) {
      console.error('Error removing element:', e);
    }
    return false;
  };

  /**
   * Handles the PDF generation and download process
   */
  const handleOpenPreview = () => {
    if (!markdown || markdown.trim() === '') {
      setError('Cannot generate PDF from empty content.');
      return;
    }
    setError(null);
    setIsPreviewModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsPreviewModalOpen(false);
  };

  const handleConfirmPdfDownload = async () => {
    setIsPreviewModalOpen(false);
    if (!markdown || markdown.trim() === '') {
      setError('Cannot generate PDF from empty content.');
      return;
    }
    setError(null);
    setIsGenerating(true);

    // Create a temporary container for the PDF content
    const tempContainer = document.createElement('div');
    tempContainer.id = 'pdf-export-container';
    tempContainer.style.position = 'fixed';
    tempContainer.style.left = '0';
    tempContainer.style.top = '0';
    tempContainer.style.width = '210mm'; // A4 width
    tempContainer.style.height = 'auto';
    tempContainer.style.backgroundColor = '#ffffff';
    tempContainer.style.color = '#333333';
    tempContainer.style.zIndex = '-1000';
    tempContainer.style.overflow = 'hidden';
    tempContainer.style.padding = '20mm';
    tempContainer.style.fontFamily = 'Arial, Helvetica, sans-serif';
    document.body.appendChild(tempContainer);

    try {
      console.log('Starting PDF export process with direct Markdown parsing');

      try {
        // Parse the Markdown content directly using our custom renderer
        const parsedHtml = parseMarkdownForPdf(markdown);

        // Clean up any remaining [object Object] instances
        const cleanedHtml = parsedHtml.replace(/\[object Object\]/g, '')
                                     .replace(/undefined/g, '')
                                     .replace(/\{\}/g, '');

        // Set the HTML content to the container
        tempContainer.innerHTML = cleanedHtml;

        // Additional cleanup after DOM insertion
        const objectTexts = tempContainer.querySelectorAll('*');
        objectTexts.forEach(el => {
          if (el.textContent && (
              el.textContent.includes('[object Object]') ||
              el.textContent.includes('undefined') ||
              el.textContent.trim() === '{}'
          )) {
            el.textContent = el.textContent
              .replace(/\[object Object\]/g, '')
              .replace(/undefined/g, '')
              .replace(/\{\}/g, '');
          }
        });

        // Apply additional processing to ensure proper rendering

        // Process code blocks for syntax highlighting
        tempContainer.querySelectorAll('pre code').forEach((block) => {
          // Add language-specific classes for better styling
          const language = block.className.match(/language-(\w+)/)?.[1];
          if (language) {
            block.parentElement.classList.add(`language-${language}`);
          }

          try {
            hljs.highlightElement(block);
          } catch (e) {
            console.warn('Error applying syntax highlighting:', e);
          }
        });

        // Process tables to ensure proper structure
        tempContainer.querySelectorAll('table').forEach(table => {
          // Make sure tables have proper structure
          if (!table.querySelector('thead') && table.rows.length > 0) {
            const thead = document.createElement('thead');
            const firstRow = table.rows[0];
            thead.appendChild(firstRow.cloneNode(true));
            table.insertBefore(thead, table.firstChild);
            table.deleteRow(0);
          }

          // Add tbody if missing
          if (!table.querySelector('tbody') && table.rows.length > 0) {
            const tbody = document.createElement('tbody');
            while (table.rows.length > 0) {
              tbody.appendChild(table.rows[0]);
            }
            table.appendChild(tbody);
          }

          // Add classes for styling
          table.classList.add('pdf-table');
          if (table.querySelector('thead')) {
            table.querySelector('thead').classList.add('pdf-thead');
          }
          if (table.querySelector('tbody')) {
            table.querySelector('tbody').classList.add('pdf-tbody');
          }
        });

        // Process links to ensure they're properly formatted
        tempContainer.querySelectorAll('a').forEach(link => {
          link.classList.add('pdf-link');
          // Make sure links have proper attributes
          if (link.getAttribute('href') && !link.getAttribute('href').startsWith('#')) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
          }
        });

        // Process images to ensure they're properly displayed
        tempContainer.querySelectorAll('img').forEach(img => {
          img.classList.add('pdf-image');
          // Set max width to ensure images fit in the PDF
          img.style.maxWidth = '100%';
          img.style.height = 'auto';

          // Add loading attribute for better performance
          img.setAttribute('loading', 'eager');

          // Add error handling for images
          img.onerror = function() {
            this.style.display = 'none';
            const errorText = document.createElement('span');
            errorText.textContent = `[Image could not be loaded: ${this.alt || this.src}]`;
            errorText.style.color = 'red';
            errorText.style.fontStyle = 'italic';
            this.parentNode.insertBefore(errorText, this);
          };
        });

        // Process headings to ensure proper hierarchy
        tempContainer.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
          const level = heading.tagName.charAt(1);
          heading.classList.add('pdf-heading', `pdf-heading-${level}`);
        });

        // Process lists to ensure proper formatting
        tempContainer.querySelectorAll('ul, ol').forEach(list => {
          const type = list.tagName.toLowerCase();
          list.classList.add('pdf-list', `pdf-${type}`);

          // Process list items
          list.querySelectorAll('li').forEach(item => {
            item.classList.add('pdf-list-item');
          });
        });

        // Apply additional processing to ensure proper rendering

        // Process code blocks for syntax highlighting
        tempContainer.querySelectorAll('pre code').forEach((block) => {
          // Add language-specific classes for better styling
          const language = block.className.match(/language-(\w+)/)?.[1];
          if (language) {
            const pre = block.parentElement;
            pre.classList.add(`language-${language}`);

            // Add language label
            pre.setAttribute('data-language', language);
          }

          try {
            hljs.highlightElement(block);
          } catch (e) {
            console.warn('Error applying syntax highlighting:', e);
          }
        });

        // Process tables to ensure proper structure
        tempContainer.querySelectorAll('table').forEach(table => {
          // Make sure tables have proper structure
          if (!table.querySelector('thead') && table.rows.length > 0) {
            const thead = document.createElement('thead');
            const firstRow = table.rows[0];
            thead.appendChild(firstRow.cloneNode(true));
            table.insertBefore(thead, table.firstChild);
            table.deleteRow(0);
          }

          // Add tbody if missing
          if (!table.querySelector('tbody') && table.rows.length > 0) {
            const tbody = document.createElement('tbody');
            while (table.rows.length > 0) {
              tbody.appendChild(table.rows[0]);
            }
            table.appendChild(tbody);
          }

          // Add classes for styling
          table.classList.add('pdf-table');
          if (table.querySelector('thead')) {
            table.querySelector('thead').classList.add('pdf-thead');
          }
          if (table.querySelector('tbody')) {
            table.querySelector('tbody').classList.add('pdf-tbody');
          }
        });

        // Process links to ensure they're properly formatted
        tempContainer.querySelectorAll('a').forEach(link => {
          link.classList.add('pdf-link');
          // Make sure links have proper attributes
          if (link.getAttribute('href') && !link.getAttribute('href').startsWith('#')) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
          }
        });

        // Process images to ensure they're properly displayed
        tempContainer.querySelectorAll('img').forEach(img => {
          img.classList.add('pdf-image');
          // Set max width to ensure images fit in the PDF
          img.style.maxWidth = '100%';
          img.style.height = 'auto';

          // Add loading attribute for better performance
          img.setAttribute('loading', 'eager');

          // Add error handling for images
          img.onerror = function() {
            this.style.display = 'none';
            const errorText = document.createElement('span');
            errorText.textContent = `[Image could not be loaded: ${this.alt || this.src}]`;
            errorText.style.color = 'red';
            errorText.style.fontStyle = 'italic';
            this.parentNode.insertBefore(errorText, this);
          };
        });

        // Process headings to ensure proper hierarchy
        tempContainer.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
          const level = heading.tagName.charAt(1);
          heading.classList.add('pdf-heading', `pdf-heading-${level}`);
        });

        // Process lists to ensure proper formatting
        tempContainer.querySelectorAll('ul, ol').forEach(list => {
          const type = list.tagName.toLowerCase();
          list.classList.add('pdf-list', `pdf-${type}`);

          // Process list items
          list.querySelectorAll('li').forEach(item => {
            item.classList.add('pdf-list-item');

            // Fix for list item alignment
            item.style.paddingLeft = '0.5em';
            item.style.lineHeight = '1.6';
          });
        });

        // Process task lists (checkboxes)
        tempContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
          // Create a custom checkbox that will render in PDF
          const customCheckbox = document.createElement('span');
          customCheckbox.classList.add('pdf-checkbox');

          if (checkbox.checked) {
            customCheckbox.innerHTML = '☑';
            customCheckbox.classList.add('pdf-checkbox-checked');
          } else {
            customCheckbox.innerHTML = '☐';
            customCheckbox.classList.add('pdf-checkbox-unchecked');
          }

          // Replace the checkbox with our custom one
          checkbox.parentNode.insertBefore(customCheckbox, checkbox);
          checkbox.parentNode.removeChild(checkbox);

          // Add task-list-item class to parent li
          let parent = customCheckbox.parentNode;
          while (parent && parent.tagName !== 'LI') {
            parent = parent.parentNode;
          }

          if (parent) {
            parent.classList.add('task-list-item');
          }
        });

        // Process definition lists
        tempContainer.querySelectorAll('dl').forEach(dl => {
          dl.classList.add('pdf-dl');

          // Process definition terms
          dl.querySelectorAll('dt').forEach(dt => {
            dt.classList.add('pdf-dt');
          });

          // Process definition descriptions
          dl.querySelectorAll('dd').forEach(dd => {
            dd.classList.add('pdf-dd');
          });
        });

        // Process inline code
        tempContainer.querySelectorAll('code:not(pre code)').forEach(code => {
          code.classList.add('pdf-inline-code');
        });

        // Process blockquotes
        tempContainer.querySelectorAll('blockquote').forEach(blockquote => {
          blockquote.classList.add('pdf-blockquote');
        });

        // Process footnotes
        const footnoteRefs = tempContainer.querySelectorAll('a[href^="#fn"], a.footnote-ref');
        if (footnoteRefs.length > 0) {
          footnoteRefs.forEach(ref => {
            ref.classList.add('pdf-footnote-ref');

            // Extract the footnote number
            const fnNum = ref.textContent.replace(/[^\d]/g, '');
            if (fnNum) {
              // Create a superscript element
              const sup = document.createElement('sup');
              sup.textContent = fnNum;
              sup.classList.add('pdf-footnote-sup');

              // Replace the reference with the superscript
              ref.innerHTML = '';
              ref.appendChild(sup);
            }
          });

          // Style the footnotes section
          const footnoteSection = tempContainer.querySelector('.footnotes');
          if (footnoteSection) {
            footnoteSection.classList.add('pdf-footnotes');

            // Add a heading if not present
            if (!footnoteSection.querySelector('h2, h3, h4')) {
              const heading = document.createElement('h3');
              heading.textContent = 'Footnotes';
              heading.classList.add('pdf-heading', 'pdf-heading-3');
              footnoteSection.insertBefore(heading, footnoteSection.firstChild);
            }

            // Style the footnote list
            const footnoteList = footnoteSection.querySelector('ol');
            if (footnoteList) {
              footnoteList.classList.add('pdf-footnote-list');

              // Style each footnote
              footnoteList.querySelectorAll('li').forEach(li => {
                li.classList.add('pdf-footnote-item');

                // Remove the return links as they don't work well in PDFs
                const returnLinks = li.querySelectorAll('a[href^="#fnref"]');
                returnLinks.forEach(link => {
                  link.parentNode.removeChild(link);
                });
              });
            }
          }
        }

        // Add styles
        const styleElement = document.createElement('style');
        styleElement.textContent = getPdfStyles();
        tempContainer.appendChild(styleElement);

        // Process page breaks
        processPageBreaks(tempContainer);

        // Get all page break elements
        const pageBreaks = tempContainer.querySelectorAll('.pagebreak');

        // If there are no page breaks, generate a single-page PDF
        if (pageBreaks.length === 0) {
          await generateSinglePagePDF(tempContainer);
        } else {
          await generateMultiPagePDF(tempContainer, pageBreaks);
        }

        console.log('PDF generation completed successfully');
      } catch (mainError) {
        console.error('Main PDF generation approach failed:', mainError);
        console.log('Attempting fallback approach...');

        try {
          // Fallback approach - simpler container and rendering
          const fallbackContainer = document.createElement('div');
          fallbackContainer.id = 'pdf-fallback-container';
          fallbackContainer.style.position = 'fixed';
          fallbackContainer.style.left = '0';
          fallbackContainer.style.top = '0';
          fallbackContainer.style.width = '210mm';
          fallbackContainer.style.backgroundColor = '#ffffff';
          fallbackContainer.style.color = '#000000';
          fallbackContainer.style.zIndex = '-1000';
          fallbackContainer.style.padding = '20mm';
          fallbackContainer.style.fontFamily = 'Arial, sans-serif';
          fallbackContainer.style.fontSize = '12pt';

          // Reset marked to ensure clean configuration
          marked.setOptions({});

          // Configure a simpler marked renderer with object handling
          const renderer = new marked.Renderer();

          // Add basic object handling to all renderer methods
          const safeStringify = (input) => {
            if (input == null) return '';
            if (typeof input === 'string') return input;

            // Handle objects
            if (typeof input === 'object') {
              if (input.text) return String(input.text);
              if (input.raw) return String(input.raw);
            }

            // Convert to string but avoid [object Object]
            const str = String(input);
            return str === '[object Object]' ? '' : str;
          };

          // Apply safe stringify to all renderer methods
          Object.keys(renderer).forEach(key => {
            if (typeof renderer[key] === 'function' && key !== 'constructor') {
              const originalFn = renderer[key];
              renderer[key] = function() {
                // Convert all arguments to safe strings
                const args = Array.from(arguments).map(arg =>
                  typeof arg === 'object' && arg !== null ? safeStringify(arg) : arg
                );
                return originalFn.apply(this, args);
              };
            }
          });

          // Ensure proper rendering of specific elements
          renderer.heading = (text, level) => {
            return `<h${level} class="pdf-heading pdf-heading-${level}">${text}</h${level}>`;
          };

          renderer.table = (header, body) => {
            return `
              <table class="pdf-table">
                <thead class="pdf-thead">${header}</thead>
                <tbody class="pdf-tbody">${body}</tbody>
              </table>
            `;
          };

          renderer.link = (href, title, text) => {
            const titleAttr = title ? ` title="${title}"` : '';
            return `<a class="pdf-link" href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
          };

          renderer.image = (href, title, text) => {
            const titleAttr = title ? ` title="${title}"` : '';
            return `<img class="pdf-image" src="${href}" alt="${text}"${titleAttr} style="max-width:100%; height:auto;">`;
          };

          renderer.code = (code, language) => {
            let highlightedCode = code;
            if (language && hljs.getLanguage(language)) {
              try {
                highlightedCode = hljs.highlight(code, { language }).value;
              } catch (err) {
                console.error('Error highlighting code:', err);
              }
            }

            return `
              <pre class="pdf-pre">
                <code class="pdf-code ${language ? `language-${language}` : ''}">${highlightedCode}</code>
              </pre>
            `;
          };

          // Apply our custom renderer
          marked.use({ renderer });

          // Parse markdown with simpler options and walkTokens
          const simpleHtml = marked.parse(markdown || '', {
            breaks: true,
            gfm: true,
            headerIds: true,
            mangle: false,
            sanitize: false,
            smartLists: true,
            smartypants: true,
            walkTokens: function(token) {
              // Handle token.text that might be an object
              if (token.text && typeof token.text === 'object') {
                token.text = safeStringify(token.text);
              }
            }
          });

          // Clean up any remaining [object Object] instances
          const cleanedHtml = simpleHtml.replace(/\[object Object\]/g, '')
                                       .replace(/undefined/g, '')
                                       .replace(/\{\}/g, '');

          fallbackContainer.innerHTML = cleanedHtml;

          // Additional cleanup after DOM insertion
          const objectTexts = fallbackContainer.querySelectorAll('*');
          objectTexts.forEach(el => {
            if (el.textContent && (
                el.textContent.includes('[object Object]') ||
                el.textContent.includes('undefined') ||
                el.textContent.trim() === '{}'
            )) {
              el.textContent = el.textContent
                .replace(/\[object Object\]/g, '')
                .replace(/undefined/g, '')
                .replace(/\{\}/g, '');
            }
          });

          // Apply additional processing to ensure proper rendering

          // Process code blocks for syntax highlighting
          fallbackContainer.querySelectorAll('pre code').forEach((block) => {
            // Add language-specific classes for better styling
            const language = block.className.match(/language-(\w+)/)?.[1];
            if (language) {
              const pre = block.parentElement;
              pre.classList.add(`language-${language}`);

              // Add language label
              pre.setAttribute('data-language', language);
            }

            try {
              hljs.highlightElement(block);
            } catch (e) {
              console.warn('Error applying syntax highlighting in fallback:', e);
            }
          });

          // Process images to ensure they're properly displayed
          fallbackContainer.querySelectorAll('img').forEach(img => {
            img.setAttribute('loading', 'eager');
            img.onerror = function() {
              this.style.display = 'none';
              const errorText = document.createElement('span');
              errorText.textContent = `[Image could not be loaded: ${this.alt || this.src}]`;
              errorText.style.color = 'red';
              errorText.style.fontStyle = 'italic';
              this.parentNode.insertBefore(errorText, this);
            };
          });

          // Process task lists (checkboxes)
          fallbackContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            // Create a custom checkbox that will render in PDF
            const customCheckbox = document.createElement('span');
            customCheckbox.classList.add('pdf-checkbox');

            if (checkbox.checked) {
              customCheckbox.innerHTML = '☑';
              customCheckbox.classList.add('pdf-checkbox-checked');
            } else {
              customCheckbox.innerHTML = '☐';
              customCheckbox.classList.add('pdf-checkbox-unchecked');
            }

            // Replace the checkbox with our custom one
            checkbox.parentNode.insertBefore(customCheckbox, checkbox);
            checkbox.parentNode.removeChild(checkbox);

            // Add task-list-item class to parent li
            let parent = customCheckbox.parentNode;
            while (parent && parent.tagName !== 'LI') {
              parent = parent.parentNode;
            }

            if (parent) {
              parent.classList.add('task-list-item');
            }
          });

          // Add to document
          document.body.appendChild(fallbackContainer);

          // Add minimal styles
          const basicStyle = document.createElement('style');
          basicStyle.textContent = `
            body { font-family: Arial, sans-serif; color: #000; background: #fff; }
            pre { background: #f8f8f8; padding: 10px; border: 1px solid #ddd; }
            code { font-family: monospace; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #000; padding: 5px; }
            img { max-width: 100%; }
            h1, h2, h3, h4, h5, h6 { color: #000; }
            a { color: #00f; }
          `;
          fallbackContainer.appendChild(basicStyle);

          // Create PDF with minimal options
          const pdf = new jsPDF('p', 'mm', 'a4');

          // Get the height of the content
          const containerHeight = fallbackContainer.scrollHeight;
          const containerWidth = fallbackContainer.scrollWidth;

          // Calculate dimensions for pagination
          const imgWidth = 210; // A4 width in mm
          const pageHeight = 297; // A4 height in mm (A4)
          const marginTop = 15; // Top margin in mm
          const marginBottom = 15; // Bottom margin in mm
          const contentHeight = pageHeight - marginTop - marginBottom; // Available content height per page
          const contentHeightPx = contentHeight * 3.779527559; // Convert mm to px (approximate)

          // Check if content needs pagination
          if (containerHeight > contentHeightPx) {
            console.log('Fallback content requires pagination, splitting into multiple pages');

            // Calculate how many pages we need
            const totalPages = Math.ceil(containerHeight / contentHeightPx);
            console.log(`Estimated total pages for fallback: ${totalPages}`);

            // Create a wrapper for positioning
            const wrapper = document.createElement('div');
            wrapper.style.position = 'absolute';
            wrapper.style.top = '0';
            wrapper.style.left = '0';
            wrapper.style.width = `${containerWidth}px`;
            wrapper.style.backgroundColor = '#ffffff';
            document.body.appendChild(wrapper);

            // Process each page
            for (let pageNum = 0; pageNum < totalPages; pageNum++) {
              console.log(`Processing fallback page ${pageNum + 1} of ${totalPages}`);

              // Create a container for this page's content
              const pageContainer = fallbackContainer.cloneNode(true);
              pageContainer.style.height = `${containerHeight}px`;
              pageContainer.style.width = `${containerWidth}px`;

              // Position the container to show only the current page's content
              pageContainer.style.position = 'absolute';
              pageContainer.style.top = `-${pageNum * contentHeightPx}px`;
              pageContainer.style.clip = `rect(${pageNum * contentHeightPx}px, ${containerWidth}px, ${(pageNum + 1) * contentHeightPx}px, 0)`;

              // Add to wrapper
              wrapper.innerHTML = '';
              wrapper.appendChild(pageContainer);

              // Use html2canvas to render this page
              const canvas = await html2canvas(wrapper, {
                scale: 1.5,
                useCORS: true,
                logging: true,
                backgroundColor: '#ffffff',
                allowTaint: true,
                scrollX: 0,
                scrollY: 0,
                windowHeight: contentHeightPx,
                height: contentHeightPx
              });

              // Add a new page for all but the first page
              if (pageNum > 0) {
                pdf.addPage();
              }

              // Calculate image height maintaining aspect ratio
              const imgHeight = (canvas.height * imgWidth) / canvas.width;

              // Add the canvas as an image to the PDF
              const imgData = canvas.toDataURL('image/jpeg', 0.95);
              pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight));
            }

            // Clean up the wrapper
            if (wrapper && wrapper.parentNode) {
              wrapper.parentNode.removeChild(wrapper);
            }
          } else {
            // Content fits on a single page, render it directly
            console.log('Fallback content fits on a single page, rendering directly');

            // Render to canvas with minimal options
            const canvas = await html2canvas(fallbackContainer, {
              scale: 1.5,
              backgroundColor: '#ffffff',
              logging: true,
              allowTaint: true,
              useCORS: true
            });

            // Add to PDF
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
          }

          // Save PDF
          pdf.save(getFilename());

          console.log('Fallback PDF generation completed successfully');

          // Clean up
          if (fallbackContainer && fallbackContainer.parentNode) {
            fallbackContainer.parentNode.removeChild(fallbackContainer);
          }
        } catch (fallbackError) {
          console.error('Fallback approach also failed:', fallbackError);

          // Ultra-simple fallback as last resort
          console.log('Attempting ultra-simple fallback approach...');

          const ultraFallbackContainer = document.createElement('div');
          ultraFallbackContainer.id = 'pdf-ultra-fallback';
          ultraFallbackContainer.style.position = 'fixed';
          ultraFallbackContainer.style.left = '0';
          ultraFallbackContainer.style.top = '0';
          ultraFallbackContainer.style.width = '210mm';
          ultraFallbackContainer.style.backgroundColor = '#ffffff';
          ultraFallbackContainer.style.padding = '20mm';
          ultraFallbackContainer.style.fontFamily = 'monospace';

          // Try to parse markdown with minimal options
          try {
            // Reset marked to ensure clean configuration
            marked.setOptions({});

            // Use default renderer with minimal options
            const minimalHtml = marked.parse(markdown || '', {
              breaks: true,
              gfm: true,
              sanitize: false
            });

            // Clean up any [object Object] instances
            const cleanedHtml = minimalHtml.replace(/\[object Object\]/g, '')
                                          .replace(/undefined/g, '')
                                          .replace(/\{\}/g, '');

            ultraFallbackContainer.innerHTML = cleanedHtml;
          } catch (parseError) {
            console.error('Ultra fallback parsing failed:', parseError);
            // Last resort: just use the raw markdown with minimal formatting
            ultraFallbackContainer.innerHTML = `<pre style="white-space: pre-wrap; font-family: monospace; font-size: 11pt; line-height: 1.5;">${markdown.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;
          }

          document.body.appendChild(ultraFallbackContainer);

          // Create PDF
          const pdf = new jsPDF('p', 'mm', 'a4');

          // Get the height of the content
          const containerHeight = ultraFallbackContainer.scrollHeight;
          const containerWidth = ultraFallbackContainer.scrollWidth;

          // Calculate dimensions for pagination
          const imgWidth = 210; // A4 width in mm
          const pageHeight = 297; // A4 height in mm (A4)
          const marginTop = 15; // Top margin in mm
          const marginBottom = 15; // Bottom margin in mm
          const contentHeight = pageHeight - marginTop - marginBottom; // Available content height per page
          const contentHeightPx = contentHeight * 3.779527559; // Convert mm to px (approximate)

          // Check if content needs pagination
          if (containerHeight > contentHeightPx) {
            console.log('Ultra-fallback content requires pagination, splitting into multiple pages');

            // Calculate how many pages we need
            const totalPages = Math.ceil(containerHeight / contentHeightPx);
            console.log(`Estimated total pages for ultra-fallback: ${totalPages}`);

            // Create a wrapper for positioning
            const wrapper = document.createElement('div');
            wrapper.style.position = 'absolute';
            wrapper.style.top = '0';
            wrapper.style.left = '0';
            wrapper.style.width = `${containerWidth}px`;
            wrapper.style.backgroundColor = '#ffffff';
            document.body.appendChild(wrapper);

            // Process each page
            for (let pageNum = 0; pageNum < totalPages; pageNum++) {
              console.log(`Processing ultra-fallback page ${pageNum + 1} of ${totalPages}`);

              // Create a container for this page's content
              const pageContainer = ultraFallbackContainer.cloneNode(true);
              pageContainer.style.height = `${containerHeight}px`;
              pageContainer.style.width = `${containerWidth}px`;

              // Position the container to show only the current page's content
              pageContainer.style.position = 'absolute';
              pageContainer.style.top = `-${pageNum * contentHeightPx}px`;
              pageContainer.style.clip = `rect(${pageNum * contentHeightPx}px, ${containerWidth}px, ${(pageNum + 1) * contentHeightPx}px, 0)`;

              // Add to wrapper
              wrapper.innerHTML = '';
              wrapper.appendChild(pageContainer);

              // Use html2canvas to render this page
              const canvas = await html2canvas(wrapper, {
                scale: 1.5,
                backgroundColor: '#ffffff',
                scrollX: 0,
                scrollY: 0,
                windowHeight: contentHeightPx,
                height: contentHeightPx
              });

              // Add a new page for all but the first page
              if (pageNum > 0) {
                pdf.addPage();
              }

              // Calculate image height maintaining aspect ratio
              const imgHeight = (canvas.height * imgWidth) / canvas.width;

              // Add the canvas as an image to the PDF
              const imgData = canvas.toDataURL('image/jpeg', 0.95);
              pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight));
            }

            // Clean up the wrapper
            if (wrapper && wrapper.parentNode) {
              wrapper.parentNode.removeChild(wrapper);
            }
          } else {
            // Content fits on a single page, render it directly
            console.log('Ultra-fallback content fits on a single page, rendering directly');

            // Render to canvas
            const canvas = await html2canvas(ultraFallbackContainer, {
              scale: 1.5,
              backgroundColor: '#ffffff'
            });

            // Add to PDF
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
          }

          // Save PDF
          pdf.save(getFilename());

          console.log('Ultra-simple fallback PDF generation completed successfully');

          // Clean up
          if (ultraFallbackContainer && ultraFallbackContainer.parentNode) {
            ultraFallbackContainer.parentNode.removeChild(ultraFallbackContainer);
          }
        }
      }
    } catch (err) {
      console.error('Error generating PDF:', err);

      // Log detailed error information for debugging
      console.error('Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack,
        toString: err.toString()
      });

      // Provide more detailed error messages to the user
      let errorMessage = 'Failed to generate PDF. ';

      if (err.message) {
        errorMessage += err.message;
      } else {
        errorMessage += 'Please try again or try with a smaller document.';
      }

      setError(errorMessage);
    } finally {
      console.log('Cleaning up after PDF generation');

      // Clean up all temporary containers
      ['pdf-export-container', 'pdf-fallback-container', 'pdf-ultra-fallback', 'pdf-content-wrapper'].forEach(id => {
        const container = document.getElementById(id);
        if (container && container.parentNode) {
          container.parentNode.removeChild(container);
          console.log(`Removed container: ${id}`);
        }
      });

      // Clean up the main temp container if it still exists
      if (tempContainer && tempContainer.parentNode) {
        tempContainer.parentNode.removeChild(tempContainer);
        console.log('Removed main temp container');
      }

      // Clean up any other temporary elements
      const tempElements = document.querySelectorAll(
        'canvas[style*="position: fixed"], canvas[style*="position: absolute"], ' +
        'div[style*="position: fixed"][style*="z-index: -"], div[style*="position: absolute"][style*="z-index: -"], ' +
        '.html2canvas-container, iframe.html2pdf__container, canvas.html2pdf__container, ' +
        'div[style*="-9999px"]'
      );

      tempElements.forEach(el => {
        if (el && el.parentNode) {
          try {
            el.parentNode.removeChild(el);
            console.log('Removed temporary element');
          } catch (e) {
            console.log('Could not remove temporary element:', e);
          }
        }
      });

      // Force a garbage collection hint
      setTimeout(() => {
        console.log('Cleanup completed');
      }, 100);

      setIsGenerating(false);
    }
  };

  /**
   * Generates a PDF from the given container, automatically handling pagination for long content
   * @param {HTMLElement} container - The container with the content
   */
  const generateSinglePagePDF = async (container) => {
    console.log('Generating PDF with automatic pagination');

    // Create a clone of the container to work with
    const containerClone = container.cloneNode(true);
    document.body.appendChild(containerClone);

    try {
      // Get the computed height of the content
      const containerHeight = containerClone.scrollHeight;
      const containerWidth = containerClone.scrollWidth;

      // Calculate dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm (A4)
      const pageHeightPx = pageHeight * 3.779527559; // Convert mm to px (approximate)
      const marginTop = 15; // Top margin in mm
      const marginBottom = 15; // Bottom margin in mm
      const contentHeight = pageHeight - marginTop - marginBottom; // Available content height per page
      const contentHeightPx = contentHeight * 3.779527559; // Convert mm to px (approximate)

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');

      // If content fits on a single page, render it directly
      if (containerHeight <= contentHeightPx) {
        console.log('Content fits on a single page, rendering directly');

        // Use html2canvas to render the container to a canvas
        const canvas = await html2canvas(containerClone, {
          scale: 2, // Higher scale for better quality
          useCORS: true,
          logging: true,
          backgroundColor: '#ffffff',
          allowTaint: true,
          letterRendering: true,
          scrollX: 0,
          scrollY: 0
        });

        // Calculate image height maintaining aspect ratio
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Add the canvas as an image to the PDF
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      } else {
        // Content is too long for a single page, split it into multiple pages
        console.log('Content requires multiple pages, implementing automatic pagination');

        // Calculate how many pages we need
        const totalPages = Math.ceil(containerHeight / contentHeightPx);
        console.log(`Estimated total pages: ${totalPages}`);

        // Create a wrapper for positioning
        const wrapper = document.createElement('div');
        wrapper.style.position = 'absolute';
        wrapper.style.top = '0';
        wrapper.style.left = '0';
        wrapper.style.width = `${containerWidth}px`;
        wrapper.style.backgroundColor = '#ffffff';
        document.body.appendChild(wrapper);

        // Process each page
        for (let pageNum = 0; pageNum < totalPages; pageNum++) {
          console.log(`Processing page ${pageNum + 1} of ${totalPages}`);

          // Create a container for this page's content
          const pageContainer = containerClone.cloneNode(true);
          pageContainer.style.height = `${containerHeight}px`;
          pageContainer.style.width = `${containerWidth}px`;

          // Position the container to show only the current page's content
          pageContainer.style.position = 'absolute';
          pageContainer.style.top = `-${pageNum * contentHeightPx}px`;
          pageContainer.style.clip = `rect(${pageNum * contentHeightPx}px, ${containerWidth}px, ${(pageNum + 1) * contentHeightPx}px, 0)`;

          // Add to wrapper
          wrapper.innerHTML = '';
          wrapper.appendChild(pageContainer);

          // Use html2canvas to render this page
          const canvas = await html2canvas(wrapper, {
            scale: 2,
            useCORS: true,
            logging: true,
            backgroundColor: '#ffffff',
            allowTaint: true,
            letterRendering: true,
            scrollX: 0,
            scrollY: 0,
            windowHeight: contentHeightPx,
            height: contentHeightPx
          });

          // Add a new page for all but the first page
          if (pageNum > 0) {
            pdf.addPage();
          }

          // Calculate image height maintaining aspect ratio
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          // Add the canvas as an image to the PDF
          const imgData = canvas.toDataURL('image/jpeg', 1.0);
          pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight));
        }

        // Clean up the wrapper
        if (wrapper && wrapper.parentNode) {
          wrapper.parentNode.removeChild(wrapper);
        }
      }

      // Save the PDF
      pdf.save(getFilename());

    } finally {
      // Clean up the clone
      if (containerClone && containerClone.parentNode) {
        containerClone.parentNode.removeChild(containerClone);
      }
    }
  };

  /**
   * Generates a multi-page PDF from the given container with page breaks
   * @param {HTMLElement} container - The container with the content
   * @param {NodeList} pageBreaks - The page break elements
   */
  const generateMultiPagePDF = async (container, pageBreaks) => {
    console.log('Generating multi-page PDF with explicit page breaks');
    console.log(`Found ${pageBreaks.length} explicit page breaks`);

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const marginTop = 15; // Top margin in mm
    const marginBottom = 15; // Bottom margin in mm
    const contentHeight = pageHeight - marginTop - marginBottom; // Available content height per page

    // Create a deep clone of the container to work with
    const containerClone = container.cloneNode(true);
    document.body.appendChild(containerClone);

    try {
      // Get all page break elements in the clone
      const clonedPageBreaks = containerClone.querySelectorAll('.pagebreak, .page-break');
      console.log(`Found ${clonedPageBreaks.length} page breaks in cloned container`);

      // Create an array to store page sections
      const pageSections = [];

      // Create a temporary container for each section
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '0';
      tempContainer.style.top = '0';
      tempContainer.style.width = `${containerClone.scrollWidth}px`;
      tempContainer.style.backgroundColor = '#ffffff';
      tempContainer.style.padding = '20mm';
      tempContainer.style.fontFamily = 'Arial, Helvetica, sans-serif';
      tempContainer.style.visibility = 'hidden';
      document.body.appendChild(tempContainer);

      // Add the first section (from start to first page break)
      if (clonedPageBreaks.length > 0) {
        console.log('Creating first section (start to first page break)');
        const firstBreak = clonedPageBreaks[0];
        const firstSection = document.createElement('div');
        firstSection.style.cssText = containerClone.style.cssText;
        firstSection.style.padding = '20mm';
        firstSection.style.backgroundColor = '#ffffff';

        // Clone all elements before the first page break
        let currentNode = containerClone.firstChild;
        while (currentNode && currentNode !== firstBreak) {
          firstSection.appendChild(currentNode.cloneNode(true));
          currentNode = currentNode.nextSibling;
        }

        pageSections.push(firstSection);

        // Add middle sections (between page breaks)
        for (let i = 0; i < clonedPageBreaks.length - 1; i++) {
          console.log(`Creating section ${i + 2} (between page breaks)`);
          const currentBreak = clonedPageBreaks[i];
          const nextBreak = clonedPageBreaks[i + 1];
          const section = document.createElement('div');
          section.style.cssText = containerClone.style.cssText;
          section.style.padding = '20mm';
          section.style.backgroundColor = '#ffffff';

          // Skip the page break itself
          currentNode = currentBreak.nextSibling;

          // Clone all elements until the next page break
          while (currentNode && currentNode !== nextBreak) {
            section.appendChild(currentNode.cloneNode(true));
            currentNode = currentNode.nextSibling;
          }

          pageSections.push(section);
        }

        // Add the last section (from last page break to end)
        console.log('Creating last section (last page break to end)');
        const lastBreak = clonedPageBreaks[clonedPageBreaks.length - 1];
        const lastSection = document.createElement('div');
        lastSection.style.cssText = containerClone.style.cssText;
        lastSection.style.padding = '20mm';
        lastSection.style.backgroundColor = '#ffffff';

        // Skip the page break itself
        currentNode = lastBreak.nextSibling;

        // Clone all remaining elements
        while (currentNode) {
          lastSection.appendChild(currentNode.cloneNode(true));
          currentNode = currentNode.nextSibling;
        }

        pageSections.push(lastSection);
      }

      // If no page sections were created, fall back to treating the entire container as one section
      if (pageSections.length === 0) {
        console.log('No page sections created, using entire container as one section');
        pageSections.push(containerClone);
      }

      console.log(`Created ${pageSections.length} page sections`);

      // Process each page section
      for (let i = 0; i < pageSections.length; i++) {
        const section = pageSections[i];
        console.log(`Processing section ${i + 1} of ${pageSections.length}`);

        // Clear the temp container and add the current section
        tempContainer.innerHTML = '';
        tempContainer.appendChild(section);

        // Check if this section needs further pagination (if it's too long)
        const sectionHeight = section.scrollHeight;
        const pageHeightPx = contentHeight * 3.779527559; // Convert mm to px (approximate)

        if (sectionHeight > pageHeightPx) {
          console.log(`Section ${i + 1} is too long (${sectionHeight}px), needs further pagination`);

          // Calculate how many pages we need for this section
          const pagesForSection = Math.ceil(sectionHeight / pageHeightPx);
          console.log(`Section ${i + 1} will be split into ${pagesForSection} pages`);

          // Create a wrapper for positioning
          const wrapper = document.createElement('div');
          wrapper.style.position = 'absolute';
          wrapper.style.top = '0';
          wrapper.style.left = '0';
          wrapper.style.width = `${section.scrollWidth}px`;
          wrapper.style.backgroundColor = '#ffffff';
          document.body.appendChild(wrapper);

          // Process each sub-page of this section
          for (let pageNum = 0; pageNum < pagesForSection; pageNum++) {
            console.log(`Processing sub-page ${pageNum + 1} of ${pagesForSection} for section ${i + 1}`);

            // Create a container for this page's content
            const pageContainer = section.cloneNode(true);
            pageContainer.style.height = `${sectionHeight}px`;
            pageContainer.style.width = `${section.scrollWidth}px`;

            // Position the container to show only the current page's content
            pageContainer.style.position = 'absolute';
            pageContainer.style.top = `-${pageNum * pageHeightPx}px`;
            pageContainer.style.clip = `rect(${pageNum * pageHeightPx}px, ${section.scrollWidth}px, ${(pageNum + 1) * pageHeightPx}px, 0)`;

            // Add to wrapper
            wrapper.innerHTML = '';
            wrapper.appendChild(pageContainer);

            // Use html2canvas to render this page
            const canvas = await html2canvas(wrapper, {
              scale: 2,
              useCORS: true,
              logging: true,
              backgroundColor: '#ffffff',
              allowTaint: true,
              letterRendering: true,
              scrollX: 0,
              scrollY: 0,
              windowHeight: pageHeightPx,
              height: pageHeightPx
            });

            // Add a new page for all but the first page of the first section
            if (i > 0 || pageNum > 0) {
              pdf.addPage();
            }

            // Calculate image height maintaining aspect ratio
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // Add the canvas as an image to the PDF
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight));
          }

          // Clean up the wrapper
          if (wrapper && wrapper.parentNode) {
            wrapper.parentNode.removeChild(wrapper);
          }
        } else {
          // Section fits on a single page
          console.log(`Section ${i + 1} fits on a single page, rendering directly`);

          try {
            // Render the section to canvas
            const canvas = await html2canvas(tempContainer, {
              scale: 2,
              useCORS: true,
              backgroundColor: '#ffffff',
              allowTaint: true,
              letterRendering: true,
              scrollX: 0,
              scrollY: 0
            });

            // Add a new page for all but the first section
            if (i > 0) {
              pdf.addPage();
            }

            // Calculate dimensions
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // Add the canvas as an image to the PDF
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
          } catch (error) {
            console.error(`Error rendering section ${i + 1}:`, error);
          }
        }
      }

      // Clean up the temp container
      if (tempContainer && tempContainer.parentNode) {
        tempContainer.parentNode.removeChild(tempContainer);
      }

      // Save the PDF
      pdf.save(getFilename());

    } finally {
      // Clean up the clone
      if (containerClone && containerClone.parentNode) {
        containerClone.parentNode.removeChild(containerClone);
      }
    }
  };

  // Generate preview HTML using our custom PDF renderer
  const previewHtml = parseMarkdownForPdf(markdown || '');

  return (
    <>
      {/* Always render the PreviewModal but control visibility with isOpen prop */}
      <PreviewModal
        isOpen={isPreviewModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmPdfDownload}
        content={previewHtml}
        contentType="html"
        title="PDF Preview (Direct from Markdown)"
      />
      <div className="relative">
        <button
          onClick={handleOpenPreview}
          className="download-button group flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-primary-light dark:bg-primary-dark text-white hover:bg-primary-hover dark:hover:bg-primary-dark-hover transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed min-w-[42px]"
          disabled={isGenerating}
          title={isGenerating ? "Generating PDF..." : "Download as PDF"}
          aria-busy={isGenerating}
          aria-disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="ml-1 font-medium">Generating...</span>
            </>
          ) : (
            <>
              <PdfIcon className="h-5 w-5 flex-shrink-0" />
              <span className="hidden group-hover:inline-block transition-all duration-300 font-medium">Download PDF</span>
            </>
          )}
        </button>

        {error && (
          <div className="absolute left-0 top-full mt-2 w-full max-w-xs z-10">
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-3 py-2 rounded-md shadow-lg text-xs break-words">
              <p className="font-semibold">Error:</p>
              <p>{error}</p>
              <button
                className="mt-2 text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
                onClick={() => setError(null)}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default PdfDownloadButton;
