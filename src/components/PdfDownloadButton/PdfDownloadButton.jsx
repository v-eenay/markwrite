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
        pre, code {
          background-color: #f5f5f5;
          border-radius: 3px;
          padding: 0.2em 0.4em;
          font-family: 'Courier New', monospace;
          overflow-x: hidden;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        pre code {
          padding: 1em;
          display: block;
        }
        img {
          max-width: 100%;
          height: auto;
        }
        blockquote {
          border-left: 4px solid #ddd;
          padding-left: 1em;
          margin-left: 0;
          color: #666;
        }
        table {
          border-collapse: collapse;
          width: 100%;
          margin-bottom: 1em;
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
      
      // Process page breaks
      const content = clonedContent.innerHTML;
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
