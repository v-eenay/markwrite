import { useState } from 'react';
import html2pdf from 'html2pdf.js';
import PdfIcon from '../icons/PdfIcon';
import './PdfDownloadButton.css';

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
    <div className="pdf-download-container">
      <button 
        className={`pdf-download-button ${isGenerating ? 'generating' : ''}`}
        onClick={handleDownloadPdf}
        disabled={isGenerating}
        title="Download as PDF"
      >
        <PdfIcon className="pdf-icon" />
        <span>Download PDF</span>
        {isGenerating && <span className="loading-spinner"></span>}
      </button>
      {error && <div className="pdf-error-message">{error}</div>}
    </div>
  );
}

export default PdfDownloadButton;
