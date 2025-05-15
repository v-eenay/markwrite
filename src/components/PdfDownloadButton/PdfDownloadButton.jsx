import { useState } from 'react';
import { marked } from 'marked';
import PreviewModal from '../PreviewModal/PreviewModal';
import html2pdf from 'html2pdf.js';
import PdfIcon from '../icons/PdfIcon';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * PdfDownloadButton Component
 * Provides functionality to generate and download PDF from markdown content
 * Completely refactored to address all requirements
 */
function PdfDownloadButton({ markdown }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const { theme } = useTheme();

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
    // Remove dark mode classes but preserve the content
    element.classList.remove('dark');

    // Remove any dark mode specific classes that might affect rendering
    const darkElements = element.querySelectorAll('.dark');
    darkElements.forEach(el => {
      el.classList.remove('dark');
    });

    // Transform dark mode specific Tailwind classes
    const darkModeElements = element.querySelectorAll('[class*="dark:"]');
    darkModeElements.forEach(el => {
      Array.from(el.classList).forEach(className => {
        if (className.startsWith('dark:')) {
          el.classList.remove(className);
        }
      });
    });

    // Fix code blocks with dark theme syntax highlighting
    const codeBlocks = element.querySelectorAll('pre code');
    codeBlocks.forEach(codeBlock => {
      // Remove dark theme classes
      codeBlock.classList.remove('dark-theme');

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
      }
    });
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
      h1, h2, h3, h4, h5, h6 {
        margin-top: 1.2em;
        margin-bottom: 0.6em;
        page-break-after: avoid;
        break-after: avoid;
        color: #2f3e46;
        font-weight: 600;
        line-height: 1.3;
      }
      h1 {
        font-size: 2em;
        border-bottom: 1px solid #eaecef;
        padding-bottom: 0.3em;
      }
      h2 {
        font-size: 1.5em;
        border-bottom: 1px solid #eaecef;
        padding-bottom: 0.3em;
      }
      h3 { font-size: 1.25em; }
      h4 { font-size: 1em; }

      /* Paragraphs */
      p {
        margin-bottom: 0.8em;
        margin-top: 0;
        text-align: justify;
        color: #333;
        line-height: 1.6;
      }

      /* Text formatting */
      strong, b {
        font-weight: 600;
        color: #24292e;
      }
      em, i {
        font-style: italic;
      }

      /* Strikethrough */
      del, s {
        text-decoration: line-through;
        color: #666;
      }

      /* Inline code */
      code:not(pre code) {
        font-family: 'Courier New', Courier, monospace;
        font-size: 0.9em;
        color: #d63384;
        background-color: rgba(214, 51, 132, 0.05);
        border-radius: 3px;
        border: 1px solid rgba(214, 51, 132, 0.1);
        padding: 0.1em 0.4em;
        white-space: normal;
        word-wrap: break-word;
      }

      /* Code blocks */
      pre {
        background-color: #f8f9fa;
        border-radius: 6px;
        padding: 1em;
        margin: 1em 0;
        overflow-x: auto;
        border: 1px solid #e9ecef;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        page-break-inside: avoid;
        break-inside: avoid;
      }
      pre code {
        padding: 0;
        background-color: transparent;
        border-radius: 0;
        display: block;
        white-space: pre;
        color: #333;
        font-size: 0.9em;
        border: none;
        font-weight: normal;
        font-family: 'Courier New', Courier, monospace;
        line-height: 1.5;
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
      img {
        max-width: 100%;
        height: auto;
        display: block;
        margin: 1em auto;
        page-break-inside: avoid;
        break-inside: avoid;
      }

      /* Lists */
      ul, ol {
        padding-left: 2em;
        margin: 1em 0;
      }
      li {
        margin-bottom: 0.5em;
      }
      li > ul, li > ol {
        margin: 0.5em 0;
      }

      /* Blockquotes */
      blockquote {
        border-left: 4px solid #6b7280;
        padding: 0.5em 1em;
        margin: 1em 0;
        background-color: #f9fafb;
        color: #4b5563;
        font-style: italic;
        display: block;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      blockquote p {
        margin: 0.5em 0;
        text-align: left;
      }

      /* Tables */
      table {
        border-collapse: collapse;
        width: 100%;
        margin: 1em 0;
        border: 1px solid #e5e7eb;
        page-break-inside: avoid;
        break-inside: avoid;
        table-layout: fixed;
      }
      th, td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }
      th {
        background-color: #f2f2f2;
        font-weight: 600;
      }
      tr:nth-child(even) {
        background-color: #f9fafb;
      }

      /* Page breaks */
      .pagebreak {
        page-break-after: always;
        break-after: page;
        height: 0;
        display: block;
        visibility: hidden;
      }

      /* Horizontal rule */
      hr {
        border: 0;
        border-top: 1px solid #eaecef;
        margin: 1.5em 0;
        height: 0;
      }

      /* Links */
      a {
        color: #0366d6;
        text-decoration: underline;
      }
    `;
  };

  /**
   * Safely removes an element from the DOM
   * @param {HTMLElement} element - The element to remove
   * @returns {boolean} - Whether the element was successfully removed
   */
  const safeRemove = (element) => {
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
      return true;
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
    if (!previewRef.current || isGenerating) return;

    try {
      setIsGenerating(true);
      setError(null);

      // Create a temporary container for the PDF content
      const tempContainer = document.createElement('div');
      tempContainer.id = 'pdf-export-container';
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '-9999px';
      document.body.appendChild(tempContainer);

      // Clone the preview content
      const clonedContent = previewRef.current.cloneNode(true);

      // Apply necessary transformations for PDF rendering
      applyThemeTransformations(clonedContent);
      processInlineCode(clonedContent);
      processTables(clonedContent);
      processBlockquotes(clonedContent);
      processPageBreaks(clonedContent);
      processJsonContent(clonedContent);

      // Add the transformed content to the temporary container
      tempContainer.appendChild(clonedContent);

      // Create a style element for the PDF
      const styleElement = document.createElement('style');
      styleElement.textContent = getPdfStyles();
      tempContainer.appendChild(styleElement);

      // Configure html2pdf options
      const options = {
        margin: 10,
        filename: getFilename(),
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2, // Higher scale for better quality
          useCORS: true,
          logging: false,
          letterRendering: true,
          allowTaint: false,
          removeContainer: true
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
          compress: true
        }
      };

      // Generate and download the PDF
      await html2pdf().set(options).from(tempContainer).save();

      // Clean up
      safeRemove(tempContainer);
      setIsGenerating(false);

    } catch (err) {
      console.error('Error generating PDF:', err);

      // Provide more detailed error messages to the user
      let errorMessage = 'Failed to generate PDF. ';

      if (err.message && err.message.includes('Unable to find element in cloned iframe')) {
        errorMessage += 'Unable to process the document structure. Please try again with a simpler document.';
      } else if (err.message) {
        // Add specific error message if available
        errorMessage += err.message;
      } else if (err.name === 'SecurityError') {
        errorMessage += 'Security error occurred. This might be due to cross-origin content in your document.';
      } else {
        // Generic error message
        errorMessage += 'Please try again or try with a smaller document.';
      }

      setError(errorMessage);

      // Clean up any temporary elements
      try {
        const container = document.getElementById('pdf-export-container');
        if (container) {
          safeRemove(container);
        }

        // Remove any iframes created by html2pdf
        const iframes = document.querySelectorAll('iframe[style*="-9999px"]');
        iframes.forEach(iframe => {
          try {
            safeRemove(iframe);
          } catch (e) {
            console.log('Could not remove iframe:', e);
          }
        });

        // Remove any canvases created by html2pdf
        const canvases = document.querySelectorAll('canvas[style*="-9999px"]');
        canvases.forEach(canvas => {
          try {
            safeRemove(canvas);
          } catch (e) {
            console.log('Could not remove canvas:', e);
          }
        });

        // Remove any other temporary elements
        const tempElements = document.querySelectorAll('.pdf-export-content, .html2pdf__container');
        tempElements.forEach(el => {
          try {
            safeRemove(el);
          } catch (e) {
            console.log('Could not remove temporary element:', e);
          }
        });
      } catch (cleanupErr) {
        console.error('Error during cleanup:', cleanupErr);
      }

      setIsGenerating(false);
    }
  };

  const previewHtml = marked.parse(markdown || '', { breaks: true, gfm: true });

  return (
    <>
      <PreviewModal
        isOpen={isPreviewModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmPdfDownload}
        content={previewHtml} // Pass HTML generated by marked for preview
        contentType="html"
      />
    <div className="relative">
      <button
        onClick={handleOpenPreview}
        className="group flex items-center gap-2 p-2 rounded-md bg-primary-light dark:bg-primary-dark text-white hover:bg-primary-hover dark:hover:bg-primary-dark-hover transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
        disabled={isGenerating}
        title={isGenerating ? "Generating PDF..." : "Download as PDF"}
        aria-busy={isGenerating}
        aria-disabled={isGenerating}
      >
        <PdfIcon className="w-5 h-5 flex-shrink-0" />
        <span className={`${isGenerating ? 'w-auto ml-1' : 'w-0 group-hover:w-auto group-hover:ml-1'} overflow-hidden whitespace-nowrap transition-all duration-300`}>
          {isGenerating ? 'Generating PDF...' : 'Download PDF'}
        </span>
        {isGenerating && (
          <span className="ml-1 h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"
                aria-hidden="true"></span>
        )}
      </button>

      {error && (
        <div className="absolute top-full left-0 right-0 mt-2 p-2 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-600 dark:text-red-400 shadow-sm">
          <div className="flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 text-red-500 dark:text-red-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium">Error</p>
              <p>{error}</p>
            </div>
          </div>
          <button
            className="mt-2 text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
            onClick={() => setError(null)}
            aria-label="Dismiss error message"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
    </>
  );
}

export default PdfDownloadButton;
