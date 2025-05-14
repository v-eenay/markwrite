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
      // Get the actual preview content - this is the div with the rendered markdown
      const previewContent = previewRef.current.querySelector('.preview-content');

      if (!previewContent) {
        console.error('Preview content element not found');
        throw new Error('Preview content not found');
      }

      // Log the preview content to help with debugging
      console.log('Preview content found:', previewContent);

      const filename = getFilename();

      // Clone the preview content to modify it for PDF generation
      const clonedContent = previewContent.cloneNode(true);

      // Create a consistent light theme for PDF export regardless of current theme
      // This ensures better readability and consistent rendering
      const isDarkMode = theme === 'dark';

      // If in dark mode, we need to transform colors properly
      if (isDarkMode) {
        // Remove dark mode classes but preserve the content
        clonedContent.classList.remove('dark');

        // Remove any dark mode specific classes that might affect rendering
        const darkElements = clonedContent.querySelectorAll('.dark');
        darkElements.forEach(el => {
          el.classList.remove('dark');
        });

        // Transform dark mode specific colors to light mode equivalents
        // This ensures proper color rendering in the PDF
        const darkModeElements = clonedContent.querySelectorAll('[class*="dark:"]');
        darkModeElements.forEach(el => {
          // Remove dark mode specific classes
          Array.from(el.classList).forEach(className => {
            if (className.startsWith('dark:')) {
              el.classList.remove(className);
            }
          });
        });

        // Fix code blocks with dark theme syntax highlighting
        const codeBlocks = clonedContent.querySelectorAll('pre code');
        codeBlocks.forEach(codeBlock => {
          // Remove dark theme classes
          codeBlock.classList.remove('dark-theme');

          // Reset background color to light theme
          if (codeBlock.parentElement) {
            codeBlock.parentElement.style.backgroundColor = '#f8f9fa';
            codeBlock.parentElement.style.color = '#333';
            codeBlock.parentElement.style.border = '1px solid #e9ecef';
          }
        });
      }

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
        /* Enhanced strikethrough styling */
        del, s, .pdf-strikethrough {
          text-decoration: line-through;
          color: #666;
          position: relative;
          display: inline-block;
        }
        .pdf-strikethrough-text {
          text-decoration: line-through !important;
          text-decoration-thickness: 1px !important;
          text-decoration-color: #666 !important;
          color: #666 !important;
          position: relative !important;
          display: inline !important;
        }
        /* Enhanced inline code styling */
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
        .pdf-inline-code-text {
          font-family: 'Courier New', Courier, monospace !important;
          font-size: 0.9em !important;
          color: #d63384 !important;
          display: inline-block !important;
          white-space: normal !important;
          word-wrap: break-word !important;
          padding: 0.1em 0.4em !important;
          font-weight: 500 !important;
          background-color: rgba(214, 51, 132, 0.05) !important;
          border-radius: 3px !important;
          border: 1px solid rgba(214, 51, 132, 0.1) !important;
          position: relative !important;
          line-height: normal !important;
          vertical-align: baseline !important;
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

      // Fix inline code display with enhanced rendering
      const inlineCodeElements = clonedContent.querySelectorAll('code:not(pre code)');
      inlineCodeElements.forEach(codeElement => {
        // Add a special class to inline code elements instead of direct style manipulation
        codeElement.classList.add('pdf-inline-code');

        // Create a new span element for better styling control
        const styledSpan = document.createElement('span');
        styledSpan.classList.add('pdf-inline-code-text');

        // Check for JSON-like content that might indicate a token object
        const textContent = codeElement.textContent || codeElement.innerHTML || '';
        const jsonPattern = /^\s*\{\s*"(type|raw|text|tokens)":/;

        let codeContent = textContent;

        if (jsonPattern.test(textContent)) {
          try {
            // Try to parse as JSON
            const jsonObj = JSON.parse(textContent);
            if (jsonObj.text) {
              codeContent = jsonObj.text;
            } else if (jsonObj.raw) {
              // Remove the backticks if present
              codeContent = jsonObj.raw.replace(/^`|`$/g, '');
            } else if (Array.isArray(jsonObj.tokens)) {
              // Extract text from tokens
              codeContent = jsonObj.tokens.map(token => {
                return token.text || token.raw || '';
              }).join('');
            } else {
              // Fallback: remove the JSON structure
              codeContent = textContent.replace(/\{.*\}/g, '').trim();
            }
          } catch (e) {
            // If JSON parsing fails, just clean up the text
            codeContent = textContent
              .replace(/\[object Object\]/g, '')
              .replace(/\{.*\}/g, '')
              .replace(/["{}]/g, '')
              .trim();
          }
        } else if (textContent.includes('[object Object]')) {
          // Handle [object Object] contamination
          codeContent = textContent.replace(/\[object Object\]/g, '').trim();
        }

        // Remove backticks that might be showing in the rendered output
        codeContent = codeContent.replace(/`/g, '');

        // Replace HTML entities that might be causing display issues
        codeContent = codeContent.replace(/&lt;/g, '<').replace(/&gt;/g, '>');

        // Set the processed content to the styled span
        styledSpan.textContent = codeContent;

        // Apply explicit styling to ensure proper rendering
        styledSpan.style.fontFamily = 'Courier New, Courier, monospace';
        styledSpan.style.fontSize = '0.9em';
        styledSpan.style.color = '#d63384';
        styledSpan.style.backgroundColor = 'rgba(214, 51, 132, 0.05)';
        styledSpan.style.borderRadius = '3px';
        styledSpan.style.border = '1px solid rgba(214, 51, 132, 0.1)';
        styledSpan.style.padding = '0.1em 0.4em';
        styledSpan.style.display = 'inline-block';
        styledSpan.style.position = 'relative';
        styledSpan.style.verticalAlign = 'baseline';
        styledSpan.style.lineHeight = 'normal';

        // Clear the element and append the styled span
        codeElement.innerHTML = '';
        codeElement.appendChild(styledSpan);
      });

      // Fix strikethrough text with enhanced rendering
      const strikethroughElements = clonedContent.querySelectorAll('del, s');
      strikethroughElements.forEach(element => {
        // Use class-based styling instead of direct style manipulation
        element.classList.add('pdf-strikethrough');

        // Create a new span element for better styling control
        const styledSpan = document.createElement('span');
        styledSpan.classList.add('pdf-strikethrough-text');

        // Check for JSON-like content that might indicate a token object
        const textContent = element.textContent || '';
        const jsonPattern = /^\s*\{\s*"(type|raw|text|tokens)":/;

        let cleanedText = '';

        if (jsonPattern.test(textContent)) {
          try {
            // Try to parse as JSON
            const jsonObj = JSON.parse(textContent);
            if (jsonObj.text) {
              cleanedText = jsonObj.text;
            } else if (jsonObj.raw) {
              // Remove the ~~ markers if present
              cleanedText = jsonObj.raw.replace(/^~~|~~$/g, '');
            } else if (Array.isArray(jsonObj.tokens)) {
              // Extract text from tokens
              cleanedText = jsonObj.tokens.map(token => {
                return token.text || token.raw || '';
              }).join('');
            } else {
              // Fallback: remove the JSON structure
              cleanedText = textContent.replace(/\{.*\}/g, '').trim();
            }
          } catch (e) {
            // If JSON parsing fails, just clean up the text
            cleanedText = textContent
              .replace(/\[object Object\]/g, '')
              .replace(/\{.*\}/g, '')
              .replace(/["{}]/g, '')
              .trim();
          }
        } else if (textContent.includes('[object Object]')) {
          // Handle [object Object] contamination
          cleanedText = textContent.replace(/\[object Object\]/g, '').trim();
        } else {
          // Just use the text content as is
          cleanedText = textContent;
        }

        // Set the cleaned text to the styled span
        styledSpan.textContent = cleanedText;

        // Apply explicit styling to ensure proper rendering
        styledSpan.style.textDecoration = 'line-through';
        styledSpan.style.textDecorationThickness = '1px';
        styledSpan.style.textDecorationColor = '#666';
        styledSpan.style.color = '#666';
        styledSpan.style.position = 'relative';

        // Clear the element and append the styled span
        element.innerHTML = '';
        element.appendChild(styledSpan);
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

      // Instead of creating a temporary container, we'll use the cloned content directly
      // This avoids issues with the iframe not finding elements

      // Apply necessary styling directly to the cloned content
      clonedContent.style.width = '210mm'; // A4 width
      clonedContent.style.minHeight = '297mm'; // A4 height
      clonedContent.style.padding = '15mm'; // Margins
      clonedContent.style.backgroundColor = '#ffffff';
      clonedContent.style.color = '#333333';
      clonedContent.style.fontFamily = 'Arial, Helvetica, sans-serif';
      clonedContent.style.fontSize = '11pt';
      clonedContent.style.lineHeight = '1.6';

      // Add a class for identification
      clonedContent.classList.add('pdf-export-content');

      // Log the cloned content to help with debugging
      console.log('Prepared content for PDF export:', clonedContent);

      // Configure html2pdf options with enhanced settings for better quality
      const options = {
        margin: [15, 15, 15, 15], // Top, right, bottom, left margins in mm
        filename: filename,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: {
          // Basic settings
          scale: 2, // Balance between quality and performance
          useCORS: true, // Allow cross-origin images
          logging: true, // Enable logging for debugging
          letterRendering: true, // Improve text rendering
          allowTaint: true, // Allow tainted canvas
          backgroundColor: '#ffffff', // Force white background

          // Fix for iframe issues
          removeContainer: false, // Don't remove the container automatically
          container: document.body, // Use document.body as the container

          // Improve image handling
          imageTimeout: 15000, // 15 seconds timeout for images

          // Don't ignore any elements to ensure all content is captured
          ignoreElements: (element) => {
            // Only ignore elements that are explicitly hidden
            return element.style &&
                  (element.style.display === 'none' ||
                   element.style.visibility === 'hidden' ||
                   element.style.opacity === '0');
          },

          // Improve text rendering with proper font loading
          fontFaces: [
            {
              family: 'Arial',
              source: 'local("Arial"), local("Helvetica"), local("sans-serif")'
            },
            {
              family: 'Courier New',
              source: 'local("Courier New"), local("Courier"), local("monospace")'
            }
          ],

          // Set proper canvas dimensions
          width: 794, // A4 width in pixels at 96 DPI
          height: 1123, // A4 height in pixels at 96 DPI

          // Improve rendering quality
          windowWidth: 1200,
          windowHeight: 1600,
          scrollX: 0,
          scrollY: 0,

          // Use standard rendering for better compatibility
          foreignObjectRendering: false,
          colorSpace: 'srgb', // Use sRGB color space for better color accuracy

          // Additional options for better rendering
          async: true, // Use async rendering
          allowTaint: true, // Allow tainted canvas

          // Fix for iframe issues
          x: 0,
          y: 0,
          scrollY: 0,
          scrollX: 0,
          windowWidth: window.innerWidth,
          windowHeight: window.innerHeight
          // Improve text rendering
          onclone: (clonedDoc) => {
            console.log('onclone callback executing');

            // Apply additional styling to ensure proper rendering
            const style = clonedDoc.createElement('style');
            style.textContent = `
              /* Global styles for better PDF rendering */
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }

              /* Base text styling */
              body {
                font-family: 'Arial', 'Helvetica', sans-serif !important;
                line-height: 1.6 !important;
                color: #333333 !important;
                background-color: #ffffff !important;
                font-size: 11pt !important;
                margin: 0 !important;
                padding: 0 !important;
              }

              /* Headings */
              h1, h2, h3, h4, h5, h6 {
                margin-top: 1.2em !important;
                margin-bottom: 0.6em !important;
                page-break-after: avoid !important;
                break-after: avoid !important;
                color: #2f3e46 !important;
                font-weight: 600 !important;
                line-height: 1.3 !important;
              }

              h1 {
                font-size: 2em !important;
                border-bottom: 1px solid #eaecef !important;
                padding-bottom: 0.3em !important;
              }

              h2 {
                font-size: 1.5em !important;
                border-bottom: 1px solid #eaecef !important;
                padding-bottom: 0.3em !important;
              }

              h3 { font-size: 1.25em !important; }
              h4 { font-size: 1em !important; }

              /* Paragraphs */
              p {
                margin-bottom: 0.8em !important;
                margin-top: 0 !important;
                color: #333333 !important;
                line-height: 1.6 !important;
              }

              /* Text formatting */
              strong, b {
                font-weight: 600 !important;
                color: #24292e !important;
              }

              em, i {
                font-style: italic !important;
              }

              /* Enhanced fix for strikethrough text */
              del, s, .pdf-strikethrough {
                text-decoration: line-through !important;
                position: relative !important;
                color: #666666 !important;
                display: inline-block !important;
              }

              .pdf-strikethrough-text {
                text-decoration: line-through !important;
                text-decoration-thickness: 1px !important;
                text-decoration-color: #666666 !important;
                color: #666666 !important;
                position: relative !important;
                display: inline !important;
              }

              /* Enhanced fix for inline code */
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
                font-size: 0.9em !important;
              }

              .pdf-inline-code-text {
                font-family: 'Courier New', Courier, monospace !important;
                font-size: 0.9em !important;
                color: #d63384 !important;
                display: inline-block !important;
                white-space: normal !important;
                word-wrap: break-word !important;
                padding: 0.1em 0.4em !important;
                font-weight: 500 !important;
                background-color: rgba(214, 51, 132, 0.05) !important;
                border-radius: 3px !important;
                border: 1px solid rgba(214, 51, 132, 0.1) !important;
                position: relative !important;
                line-height: normal !important;
                vertical-align: baseline !important;
              }

              /* Code blocks */
              pre {
                background-color: #f8f9fa !important;
                border-radius: 6px !important;
                padding: 1em !important;
                margin: 1em 0 !important;
                overflow-x: auto !important;
                border: 1px solid #e9ecef !important;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05) !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }

              pre code {
                padding: 0 !important;
                background-color: transparent !important;
                border-radius: 0 !important;
                display: block !important;
                white-space: pre !important;
                color: #333333 !important;
                font-size: 0.9em !important;
                border: none !important;
                font-weight: normal !important;
                font-family: 'Courier New', Courier, monospace !important;
                line-height: 1.5 !important;
              }

              /* Lists */
              ul, ol {
                padding-left: 2em !important;
                margin: 1em 0 !important;
              }

              li {
                margin-bottom: 0.5em !important;
              }

              li > ul, li > ol {
                margin: 0.5em 0 !important;
              }

              /* Tables */
              table {
                border-collapse: collapse !important;
                width: 100% !important;
                margin: 1em 0 !important;
                border: 1px solid #e5e7eb !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                table-layout: fixed !important;
              }

              th, td {
                border: 1px solid #dddddd !important;
                padding: 8px !important;
                text-align: left !important;
                word-wrap: break-word !important;
                overflow-wrap: break-word !important;
              }

              th {
                background-color: #f2f2f2 !important;
                font-weight: 600 !important;
              }

              tr:nth-child(even) {
                background-color: #f9fafb !important;
              }

              /* Blockquotes */
              blockquote, .pdf-blockquote {
                border-left: 4px solid #6b7280 !important;
                padding: 0.5em 1em !important;
                margin: 1em 0 !important;
                background-color: #f9fafb !important;
                color: #4b5563 !important;
                font-style: italic !important;
                display: block !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }

              blockquote p, .blockquote-paragraph {
                margin: 0.5em 0 !important;
                text-align: left !important;
              }

              /* Images */
              img {
                max-width: 100% !important;
                height: auto !important;
                display: block !important;
                margin: 1em auto !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }

              /* Links */
              a {
                color: #0366d6 !important;
                text-decoration: underline !important;
              }

              /* Page breaks */
              .pagebreak {
                page-break-after: always !important;
                break-after: page !important;
                height: 0 !important;
                display: block !important;
                visibility: hidden !important;
              }

              /* Horizontal rule */
              hr {
                border: 0 !important;
                border-top: 1px solid #eaecef !important;
                margin: 1.5em 0 !important;
                height: 0 !important;
              }

              /* Syntax highlighting for code blocks */
              .hljs-keyword, .hljs-selector-tag, .hljs-addition {
                color: #0550ae !important;
                font-weight: bold !important;
              }

              .hljs-number, .hljs-string, .hljs-meta .hljs-meta-string, .hljs-literal, .hljs-doctag, .hljs-regexp {
                color: #2e7d32 !important;
              }

              .hljs-title, .hljs-section, .hljs-name, .hljs-selector-id, .hljs-selector-class {
                color: #d32f2f !important;
              }

              .hljs-attribute, .hljs-attr, .hljs-variable, .hljs-template-variable, .hljs-class .hljs-title, .hljs-type {
                color: #e65100 !important;
              }

              .hljs-symbol, .hljs-bullet, .hljs-subst, .hljs-meta, .hljs-meta .hljs-keyword, .hljs-selector-attr, .hljs-selector-pseudo, .hljs-link {
                color: #7b1fa2 !important;
              }

              .hljs-built_in, .hljs-deletion {
                color: #0277bd !important;
              }

              .hljs-comment, .hljs-quote {
                color: #5d6c79 !important;
                font-style: italic !important;
              }
            `;
            clonedDoc.head.appendChild(style);

            // Enhanced processing for strikethrough elements
            const strikethroughElements = clonedDoc.querySelectorAll('del, s');
            strikethroughElements.forEach(el => {
              // Add class instead of direct style manipulation
              el.classList.add('pdf-strikethrough');

              // Create a new span element for better styling control
              const styledSpan = document.createElement('span');
              styledSpan.classList.add('pdf-strikethrough-text');

              // Check for JSON-like content that might indicate a token object
              const textContent = el.textContent || '';
              const jsonPattern = /^\s*\{\s*"(type|raw|text|tokens)":/;

              let cleanedText = '';

              if (jsonPattern.test(textContent)) {
                try {
                  // Try to parse as JSON
                  const jsonObj = JSON.parse(textContent);
                  if (jsonObj.text) {
                    cleanedText = jsonObj.text;
                  } else if (jsonObj.raw) {
                    // Remove the ~~ markers if present
                    cleanedText = jsonObj.raw.replace(/^~~|~~$/g, '');
                  } else if (Array.isArray(jsonObj.tokens)) {
                    // Extract text from tokens
                    cleanedText = jsonObj.tokens.map(token => {
                      return token.text || token.raw || '';
                    }).join('');
                  } else {
                    // Fallback: remove the JSON structure
                    cleanedText = textContent.replace(/\{.*\}/g, '').trim();
                  }
                } catch (e) {
                  // If JSON parsing fails, just clean up the text
                  cleanedText = textContent
                    .replace(/\[object Object\]/g, '')
                    .replace(/\{.*\}/g, '')
                    .replace(/["{}]/g, '')
                    .trim();
                }
              } else if (textContent.includes('[object Object]')) {
                // Handle [object Object] contamination
                cleanedText = textContent.replace(/\[object Object\]/g, '').trim();
              } else {
                // Just use the text content as is
                cleanedText = textContent;
              }

              // Set the cleaned text to the styled span
              styledSpan.textContent = cleanedText;

              // Apply explicit styling to ensure proper rendering
              styledSpan.style.textDecoration = 'line-through';
              styledSpan.style.textDecorationThickness = '1px';
              styledSpan.style.textDecorationColor = '#666';
              styledSpan.style.color = '#666';
              styledSpan.style.position = 'relative';

              // Clear the element and append the styled span
              el.innerHTML = '';
              el.appendChild(styledSpan);
            });

            // Enhanced processing for inline code elements
            const inlineCodeElements = clonedDoc.querySelectorAll('code:not(pre code), .inline-code');
            inlineCodeElements.forEach(el => {
              // Add class instead of direct style manipulation
              el.classList.add('pdf-inline-code');

              // Create a new span element for better styling control
              const styledSpan = document.createElement('span');
              styledSpan.classList.add('pdf-inline-code-text');

              // Check for JSON-like content that might indicate a token object
              const textContent = el.textContent || el.innerHTML || '';
              const jsonPattern = /^\s*\{\s*"(type|raw|text|tokens)":/;

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

              // Set the cleaned content to the styled span
              styledSpan.textContent = cleanContent;

              // Apply explicit styling to ensure proper rendering
              styledSpan.style.fontFamily = 'Courier New, Courier, monospace';
              styledSpan.style.fontSize = '0.9em';
              styledSpan.style.color = '#d63384';
              styledSpan.style.backgroundColor = 'rgba(214, 51, 132, 0.05)';
              styledSpan.style.borderRadius = '3px';
              styledSpan.style.border = '1px solid rgba(214, 51, 132, 0.1)';
              styledSpan.style.padding = '0.1em 0.4em';
              styledSpan.style.display = 'inline-block';
              styledSpan.style.position = 'relative';
              styledSpan.style.verticalAlign = 'baseline';
              styledSpan.style.lineHeight = 'normal';

              // Clear the element and append the styled span
              el.innerHTML = '';
              el.appendChild(styledSpan);
            });
          }
        },
        jsPDF: {
          // Basic settings
          unit: 'mm', // Use millimeters as the unit
          format: 'a4', // Use A4 paper size
          orientation: 'portrait', // Use portrait orientation

          // Simplify options to avoid conflicts
          compress: false,

          // Improve precision for better rendering
          precision: 16,

          // Apply only essential hotfixes
          hotfixes: ["px_scaling"],

          // Basic font rendering
          putTotalPages: true,

          // Basic color rendering
          colorSpace: 'srgb', // Use sRGB color space for better color accuracy

          // Basic image quality
          imageQuality: 1.0,

          // Simplified margins
          margin: [15, 15, 15, 15] // Top, right, bottom, left margins in mm
        }
      };

      // Generate PDF using a more direct approach
      try {
        console.log('Starting PDF generation with simplified approach');

        // Append the cloned content to the document body temporarily
        document.body.appendChild(clonedContent);

        // Use a simpler approach with html2pdf
        const element = document.querySelector('.pdf-export-content');
        if (!element) {
          throw new Error('PDF content element not found');
        }

        console.log('Using element for PDF generation:', element);

        // Generate the PDF with a simpler configuration
        await html2pdf(element, options);

        console.log('PDF generated and saved successfully');

        // Remove the element from the document body
        if (document.body.contains(clonedContent)) {
          document.body.removeChild(clonedContent);
        }
      } catch (pdfError) {
        console.error('Error during PDF generation:', pdfError);

        // Remove the element from the document body if an error occurs
        if (document.body.contains(clonedContent)) {
          document.body.removeChild(clonedContent);
        }

        throw pdfError;
      }
    } catch (err) {
      console.error('Error generating PDF:', err);

      // Provide more detailed error messages to the user
      let errorMessage = 'Failed to generate PDF. ';

      if (err.message && err.message.includes('Unable to find element in cloned iframe')) {
        // Handle the specific iframe error
        errorMessage += 'Unable to process the document structure. Try using a simpler document or fewer images.';

        // Log additional information for debugging
        console.log('Iframe error details:', {
          previewContent: previewRef.current?.querySelector('.preview-content'),
          clonedContent: clonedContent
        });
      } else if (err.message) {
        // Add specific error message if available
        errorMessage += err.message;
      } else if (err.name === 'SecurityError') {
        errorMessage += 'Security restrictions prevented PDF generation. Try again in a different browser.';
      } else if (err.name === 'NetworkError') {
        errorMessage += 'Network error occurred. Please check your connection and try again.';
      } else if (err.name === 'AbortError') {
        errorMessage += 'PDF generation was aborted. Please try again.';
      } else if (err.name === 'TimeoutError' || err.message?.includes('timeout')) {
        errorMessage += 'PDF generation timed out. Try with a smaller document or fewer images.';
      } else {
        // Generic error message
        errorMessage += 'Please try again or try with a smaller document.';
      }

      setError(errorMessage);

      // Clean up any temporary elements created by html2pdf
      try {
        // Remove any iframes created by html2pdf
        const iframes = document.querySelectorAll('iframe[style*="-9999px"]');
        iframes.forEach(iframe => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        });

        // Remove any canvases created by html2pdf
        const canvases = document.querySelectorAll('canvas[style*="-9999px"]');
        canvases.forEach(canvas => {
          if (document.body.contains(canvas)) {
            document.body.removeChild(canvas);
          }
        });

        // Remove any other temporary elements
        const tempElements = document.querySelectorAll('.pdf-export-content, .html2pdf__container');
        tempElements.forEach(el => {
          if (document.body.contains(el)) {
            document.body.removeChild(el);
          }
        });

        console.log('Cleanup completed successfully');
      } catch (cleanupErr) {
        console.error('Error during cleanup:', cleanupErr);
      }
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
  );
}

export default PdfDownloadButton;
