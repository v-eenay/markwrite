import { useState } from 'react';
import html2pdf from 'html2pdf.js';
import PdfIcon from '../icons/PdfIcon';

function PdfDownloadButton({ previewRef, markdown }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

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
      
      // Add PDF-specific styling
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
        }
        h1, h2, h3, h4, h5, h6 {
          margin-top: 1em;
          margin-bottom: 0.5em;
          page-break-after: avoid;
        }
        p {
          margin-bottom: 0.8em;
          text-align: justify;
        }
        /* Simplified inline code styling without background */
        code, .inline-code {
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
          color: #d63384;
          display: inline;
          white-space: normal;
          word-wrap: break-word;
          border-bottom: 1px dotted #d63384;
          padding: 0 2px;
          font-weight: 500;
        }
        /* Fix for code blocks */
        pre {
          background-color: #f5f5f5;
          border-radius: 5px;
          padding: 1em;
          margin: 1em 0;
          overflow-x: auto;
          border: 1px solid #e5e7eb;
        }
        pre code {
          padding: 0;
          background-color: transparent;
          border-radius: 0;
          display: block;
          white-space: pre;
          color: #333;
          font-size: 0.9em;
          border-bottom: none;
          font-weight: normal;
        }
        img {
          max-width: 100%;
          height: auto;
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
        table {
          border-collapse: collapse;
          width: 100%;
          margin: 1em 0;
          border: 1px solid #e5e7eb;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
        }
        th {
          background-color: #f2f2f2;
        }
        /* Handle page breaks */
        .pagebreak {
          page-break-after: always;
        }
      `;
      clonedContent.appendChild(styleElement);
      
      // Process page breaks and fix formatting issues
      let content = clonedContent.innerHTML;
      
      // Fix inline code display
      const inlineCodeElements = clonedContent.querySelectorAll('code:not(pre code)');
      inlineCodeElements.forEach(codeElement => {
        // Add a special class to inline code elements
        codeElement.classList.add('inline-code');
        
        // Process the content to ensure proper display
        let codeContent = codeElement.innerHTML;
        
        // Remove backticks that might be showing in the rendered output
        codeContent = codeContent.replace(/`/g, '');
        
        // Replace HTML entities that might be causing display issues
        codeContent = codeContent.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        
        // Set the processed content back
        codeElement.innerHTML = codeContent;
      });
      
      // Fix blockquote styling
      const blockquoteElements = clonedContent.querySelectorAll('blockquote');
      blockquoteElements.forEach(blockquote => {
        blockquote.classList.add('pdf-blockquote');
        // Make sure nested paragraphs are properly styled
        const paragraphs = blockquote.querySelectorAll('p');
        paragraphs.forEach(p => p.classList.add('blockquote-paragraph'));
      });
      
      // Replace page breaks
      content = clonedContent.innerHTML;
      clonedContent.innerHTML = content.replace(/---pagebreak---/g, '<div class="pagebreak"></div>');
      
      // Configure html2pdf options with improved settings
      const options = {
        margin: [15, 15, 15, 15], // Top, right, bottom, left margins in mm
        filename: filename,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { 
          scale: 2, // Higher scale for better quality
          useCORS: true,
          logging: false,
          letterRendering: true,
          allowTaint: true
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait',
          compress: true,
          precision: 16
        }
      };

      // Generate PDF from the cloned and styled content
      await html2pdf().from(clonedContent).set(options).save();
      
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
