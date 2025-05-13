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

      // Configure html2pdf options
      const options = {
        margin: 10,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: false
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // Generate PDF
      await html2pdf().from(previewContent).set(options).save();
      
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
        className={`flex items-center gap-2 px-3 py-2 rounded-md bg-primary-light dark:bg-primary-dark text-white hover:bg-primary-hover dark:hover:bg-primary-dark-hover transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed`}
        onClick={handleDownloadPdf}
        disabled={isGenerating}
        title="Download as PDF"
      >
        <PdfIcon className="w-5 h-5" />
        <span>Download PDF</span>
        {isGenerating && (
          <span className="ml-1 h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
        )}
      </button>
      {error && <div className="mt-2 text-sm text-red-500 dark:text-red-400">{error}</div>}
    </div>
  );
}

export default PdfDownloadButton;
