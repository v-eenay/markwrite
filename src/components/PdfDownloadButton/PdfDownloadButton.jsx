import { useState } from 'react';
import html2pdf from 'html2pdf.js';
import PdfIcon from '../icons/PdfIcon';
import { useTheme } from '../../contexts/ThemeContext';

function PdfDownloadButton({ previewRef, markdown }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const { theme } = useTheme();

  const getFilename = () => {
    // Try to extract the first heading from markdown
    const headingMatch = markdown.match(/^# (.+)$/m);
    if (headingMatch && headingMatch[1]) {
      // Clean the heading to make it suitable for a filename
      return `${headingMatch[1].replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`;
    }
    return 'markwrite-document.pdf';
  };

  const handleDownloadPdf = async () => {
    if (!previewRef.current || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      const previewContent = previewRef.current.querySelector('.preview-content');

      if (!previewContent) {
        throw new Error('Preview content not found');
      }

      const filename = getFilename();

      // Clone the preview content to modify it for PDF generation
      const clonedContent = previewContent.cloneNode(true);

      // Force light mode styling for PDF export regardless of current theme
      // This ensures better readability and consistent rendering
      clonedContent.classList.remove('dark');

      // Remove any dark mode specific classes that might affect rendering
      const darkElements = clonedContent.querySelectorAll('.dark');
      darkElements.forEach(el => {
        el.classList.remove('dark');
      });

      // Add PDF-specific styling with enhanced code block styling
      const styleElement = document.createElement('style');
      styleElement.textContent = `
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
        h1, h2, h3, h4, h5, h6 {
          margin-top: 1.2em;
          margin-bottom: 0.6em;
          page-break-after: avoid;
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
        h3 {
          font-size: 1.25em;
        }
        h4 {
          font-size: 1em;
        }
        p {
          margin-bottom: 0.8em;
          margin-top: 0;
          text-align: justify;
          color: #333;
          line-height: 1.6;
        }
        strong {
          font-weight: 600;
          color: #24292e;
        }
        em {
          font-style: italic;
        }
        /* Strikethrough styling */
        del, s, .pdf-strikethrough {
          text-decoration: line-through;
          color: #666;
          position: relative;
        }
        /* Improved inline code styling */
        code:not(pre code), .inline-code, .pdf-inline-code {
          font-family: 'Courier New', Courier, monospace;
          font-size: 0.9em;
          color: #d63384;
          display: inline-block;
          white-space: normal;
          word-wrap: break-word;
          padding: 0.1em 0.4em;
          font-weight: 500;
          background-color: rgba(214, 51, 132, 0.05);
          border-radius: 3px;
          border: 1px solid rgba(214, 51, 132, 0.1);
          position: relative;
          line-height: normal;
          vertical-align: baseline;
        }
        /* Enhanced code blocks styling */
        pre {
          background-color: #f8f9fa;
          border-radius: 6px;
          padding: 1em;
          margin: 1em 0;
          overflow-x: auto;
          border: 1px solid #e9ecef;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          page-break-inside: avoid;
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
        /* Syntax highlighting for code blocks - light theme */
        .hljs-keyword, .hljs-selector-tag, .hljs-addition {
          color: #0550ae;
          font-weight: bold;
        }
        .hljs-number, .hljs-string, .hljs-meta .hljs-meta-string, .hljs-literal, .hljs-doctag, .hljs-regexp {
          color: #2e7d32;
        }
        .hljs-title, .hljs-section, .hljs-name, .hljs-selector-id, .hljs-selector-class {
          color: #d32f2f;
        }
        .hljs-attribute, .hljs-attr, .hljs-variable, .hljs-template-variable, .hljs-class .hljs-title, .hljs-type {
          color: #e65100;
        }
        .hljs-symbol, .hljs-bullet, .hljs-subst, .hljs-meta, .hljs-meta .hljs-keyword, .hljs-selector-attr, .hljs-selector-pseudo, .hljs-link {
          color: #7b1fa2;
        }
        .hljs-built_in, .hljs-deletion {
          color: #0277bd;
        }
        .hljs-comment, .hljs-quote {
          color: #5d6c79;
          font-style: italic;
        }
        /* Language-specific syntax highlighting */
        .language-javascript .hljs-keyword,
        .language-typescript .hljs-keyword {
          color: #0550ae;
        }
        .language-javascript .hljs-string,
        .language-typescript .hljs-string {
          color: #2e7d32;
        }
        .language-python .hljs-keyword {
          color: #0550ae;
        }
        .language-python .hljs-string {
          color: #2e7d32;
        }
        .language-html .hljs-tag,
        .language-xml .hljs-tag {
          color: #22863a;
        }
        .language-html .hljs-name,
        .language-xml .hljs-name {
          color: #6f42c1;
        }
        .language-html .hljs-attr,
        .language-xml .hljs-attr {
          color: #005cc5;
        }
        .language-css .hljs-selector-tag,
        .language-css .hljs-selector-id,
        .language-css .hljs-selector-class {
          color: #22863a;
        }
        .language-css .hljs-property {
          color: #005cc5;
        }
        img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 1em auto;
          page-break-inside: avoid;
        }
        /* Lists styling */
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
        /* Fix for blockquotes */
        blockquote, .pdf-blockquote {
          border-left: 4px solid #6b7280;
          padding: 0.5em 1em;
          margin: 1em 0;
          background-color: #f9fafb;
          color: #4b5563;
          font-style: italic;
          display: block;
          page-break-inside: avoid;
        }
        blockquote p, .blockquote-paragraph {
          margin: 0.5em 0;
          text-align: left;
        }
        /* Enhanced table styling */
        table {
          border-collapse: collapse;
          width: 100%;
          margin: 1em 0;
          border: 1px solid #e5e7eb;
          page-break-inside: avoid;
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
        /* Handle page breaks */
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
      clonedContent.appendChild(styleElement);

      // Process page breaks and fix formatting issues
      let content = clonedContent.innerHTML;

      // Fix inline code display
      const inlineCodeElements = clonedContent.querySelectorAll('code:not(pre code)');
      inlineCodeElements.forEach(codeElement => {
        // Add a special class to inline code elements instead of direct style manipulation
        codeElement.classList.add('pdf-inline-code');

        // Process the content to ensure proper display
        let codeContent = codeElement.textContent || codeElement.innerHTML;

        // Remove backticks that might be showing in the rendered output
        codeContent = codeContent.replace(/`/g, '');

        // Replace HTML entities that might be causing display issues
        codeContent = codeContent.replace(/&lt;/g, '<').replace(/&gt;/g, '>');

        // Set the processed content back
        codeElement.innerHTML = codeContent;
      });

      // Fix strikethrough text
      const strikethroughElements = clonedContent.querySelectorAll('del, s');
      strikethroughElements.forEach(element => {
        // Use class-based styling instead of direct style manipulation
        element.classList.add('pdf-strikethrough');

        // Ensure the content is preserved
        const textContent = element.textContent;
        if (textContent) {
          // Clear any potential [object Object] content
          element.innerHTML = textContent;
        }
      });

      // Fix code block styling and ensure syntax highlighting is preserved
      const codeBlocks = clonedContent.querySelectorAll('pre code');
      codeBlocks.forEach(codeBlock => {
        // Ensure the code block has proper language class
        const language = codeBlock.className.match(/language-(\w+)/)?.[1];
        if (language) {
          codeBlock.parentElement.classList.add(`language-${language}`);
        }

        // Make sure the code block has proper styling
        codeBlock.parentElement.style.pageBreakInside = 'avoid';
        codeBlock.parentElement.style.breakInside = 'avoid';

        // Clean up any HTML entities in the code block
        let codeContent = codeBlock.innerHTML;
        // Only replace entities if they're not part of syntax highlighting spans
        if (!codeContent.includes('<span class="hljs')) {
          codeContent = codeContent.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
          codeBlock.innerHTML = codeContent;
        }
      });

      // Fix table styling for better column width distribution
      const tables = clonedContent.querySelectorAll('table');
      tables.forEach(table => {
        // Add a class for better styling
        table.classList.add('pdf-table');
        table.style.tableLayout = 'fixed';
        table.style.width = '100%';
        table.style.pageBreakInside = 'avoid';
        table.style.breakInside = 'avoid';

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
            });
          }
        }
      });

      // Fix blockquote styling
      const blockquoteElements = clonedContent.querySelectorAll('blockquote');
      blockquoteElements.forEach(blockquote => {
        blockquote.classList.add('pdf-blockquote');
        blockquote.style.pageBreakInside = 'avoid';
        blockquote.style.breakInside = 'avoid';
        // Make sure nested paragraphs are properly styled
        const paragraphs = blockquote.querySelectorAll('p');
        paragraphs.forEach(p => p.classList.add('blockquote-paragraph'));
      });

      // Fix list styling
      const lists = clonedContent.querySelectorAll('ul, ol');
      lists.forEach(list => {
        // Add proper indentation
        list.style.paddingLeft = '2em';
        list.style.marginTop = '1em';
        list.style.marginBottom = '1em';

        // Style list items
        const items = list.querySelectorAll('li');
        items.forEach(item => {
          item.style.marginBottom = '0.5em';
        });

        // Handle nested lists
        const nestedLists = list.querySelectorAll('li > ul, li > ol');
        nestedLists.forEach(nestedList => {
          nestedList.style.marginTop = '0.5em';
          nestedList.style.marginBottom = '0';
        });
      });

      // Process page breaks for PDF export
      // First, find any existing page-break divs and convert them to the PDF-specific pagebreak class
      const pageBreakDivs = clonedContent.querySelectorAll('.page-break');
      pageBreakDivs.forEach(div => {
        const pageBreakDiv = document.createElement('div');
        pageBreakDiv.className = 'pagebreak';
        div.parentNode.replaceChild(pageBreakDiv, div);
      });

      // Also check for any remaining ---pagebreak--- markers in the content
      content = clonedContent.innerHTML;
      clonedContent.innerHTML = content.replace(/---pagebreak---/g, '<div class="pagebreak"></div>');

      // Create a temporary container for the PDF content
      const tempContainer = document.createElement('div');
      tempContainer.appendChild(clonedContent);
      document.body.appendChild(tempContainer);
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '-9999px';

      // Configure html2pdf options with enhanced settings for better quality
      const options = {
        margin: [15, 15, 15, 15], // Top, right, bottom, left margins in mm
        filename: filename,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: {
          scale: 4, // Higher scale for better quality and sharper text
          useCORS: true,
          logging: false,
          letterRendering: true,
          allowTaint: true,
          backgroundColor: '#ffffff', // Force white background
          removeContainer: true,
          // Improve text rendering
          fontFaces: [
            {
              family: 'Arial',
              source: 'local("Arial"), local("Helvetica")'
            },
            {
              family: 'Courier New',
              source: 'local("Courier New"), local("Courier")'
            }
          ],
          // Improve rendering quality
          windowWidth: 1200,
          windowHeight: 1600,
          scrollX: 0,
          scrollY: 0,
          // Improve text rendering
          onclone: (clonedDoc) => {
            // Apply additional styling to ensure proper rendering
            const style = clonedDoc.createElement('style');
            style.textContent = `
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              pre, code, table, blockquote {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              h1, h2, h3, h4, h5, h6 {
                page-break-after: avoid !important;
                break-after: avoid !important;
              }
              img {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              /* Fix for strikethrough text */
              del, s, .pdf-strikethrough {
                text-decoration: line-through !important;
                position: relative !important;
                color: #666 !important;
              }
              /* Fix for inline code */
              code:not(pre code), .inline-code, .pdf-inline-code {
                display: inline-block !important;
                position: relative !important;
                vertical-align: baseline !important;
                line-height: normal !important;
                padding: 0.1em 0.4em !important;
                background-color: rgba(214, 51, 132, 0.05) !important;
                border-radius: 3px !important;
                border: 1px solid rgba(214, 51, 132, 0.1) !important;
                font-family: 'Courier New', Courier, monospace !important;
                color: #d63384 !important;
              }
            `;
            clonedDoc.head.appendChild(style);

            // Additional processing for strikethrough elements
            const strikethroughElements = clonedDoc.querySelectorAll('del, s');
            strikethroughElements.forEach(el => {
              // Add class instead of direct style manipulation
              el.classList.add('pdf-strikethrough');

              // Ensure the content is preserved
              const textContent = el.textContent;
              if (textContent) {
                // Clear any potential [object Object] content
                el.innerHTML = textContent;
              }
            });

            // Additional processing for inline code elements
            const inlineCodeElements = clonedDoc.querySelectorAll('code:not(pre code), .inline-code');
            inlineCodeElements.forEach(el => {
              // Add class instead of direct style manipulation
              el.classList.add('pdf-inline-code');

              // Ensure the content is preserved
              const textContent = el.textContent || el.innerHTML;
              if (textContent) {
                // Clean up the content
                let cleanContent = textContent.replace(/`/g, '');
                cleanContent = cleanContent.replace(/&lt;/g, '<').replace(/&gt;/g, '>');

                // Clear any potential [object Object] content
                el.innerHTML = cleanContent;
              }
            });
          }
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
          compress: true,
          precision: 16,
          floatPrecision: 16,
          hotfixes: ["px_scaling"],
          // Improve font rendering
          putTotalPages: true,
          userUnit: 1.0
        }
      };

      // Generate PDF from the cloned and styled content
      await html2pdf().from(clonedContent).set(options).save();

      // Clean up the temporary container
      document.body.removeChild(tempContainer);

      console.log('PDF generated successfully');
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative">
      <button
        className="group flex items-center gap-2 p-2 rounded-md bg-primary-light dark:bg-primary-dark text-white hover:bg-primary-hover dark:hover:bg-primary-dark-hover transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
        onClick={handleDownloadPdf}
        disabled={isGenerating}
        title="Download as PDF"
      >
        <PdfIcon className="w-5 h-5 flex-shrink-0" />
        <span className="w-0 group-hover:w-auto overflow-hidden whitespace-nowrap transition-all duration-300 group-hover:ml-1">Download PDF</span>
        {isGenerating && (
          <span className="ml-1 h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
        )}
      </button>
      {error && <div className="mt-2 text-sm text-red-500 dark:text-red-400">{error}</div>}
    </div>
  );
}

export default PdfDownloadButton;
