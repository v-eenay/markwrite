import React from 'react';
import { exportToPDF, exportToDOCX } from '../utils/exportUtils';

const ExportToolbar = ({ markdown }) => {
  const handleExportPDF = async () => {
    const result = await exportToPDF(markdown, 'markwrite-document.pdf');
    if (!result.success) {
      alert(`Failed to export PDF: ${result.error}`);
    }
  };

  const handleExportDOCX = async () => {
    const result = await exportToDOCX(markdown, 'markwrite-document.docx');
    if (!result.success) {
      alert(`Failed to export DOCX: ${result.error}`);
    }
  };

  return (
    <div className="export-toolbar">
      <button className="export-button" onClick={handleExportPDF}>
        Export to PDF
      </button>
      <button className="export-button" onClick={handleExportDOCX}>
        Export to DOCX
      </button>
    </div>
  );
};

export default ExportToolbar;