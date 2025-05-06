import React, { useState } from 'react';
import { exportToPDF, exportToDOCX } from '../utils/exportUtils';
import './ExportToolbar.css';

const ExportToolbar = ({ markdown }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState(null);

  const handleExportPDF = async () => {
    setIsExporting(true);
    setExportType('PDF');

    try {
      const result = await exportToPDF(markdown, 'markwrite-document.pdf');
      if (!result.success) {
        alert(`Failed to export PDF: ${result.error}`);
      }
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  const handleExportDOCX = async () => {
    setIsExporting(true);
    setExportType('DOCX');

    try {
      const result = await exportToDOCX(markdown, 'markwrite-document.docx');
      if (!result.success) {
        alert(`Failed to export DOCX: ${result.error}`);
      }
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  return (
    <div className="export-toolbar">
      <div className="export-toolbar-title">Export Document</div>
      <div className="export-buttons">
        <button
          className={`export-button ${isExporting && exportType === 'PDF' ? 'exporting' : ''}`}
          onClick={handleExportPDF}
          disabled={isExporting}
        >
          <span className="export-icon pdf-icon">📄</span>
          <span className="export-text">
            {isExporting && exportType === 'PDF' ? 'Exporting...' : 'Export to PDF'}
          </span>
        </button>

        <button
          className={`export-button ${isExporting && exportType === 'DOCX' ? 'exporting' : ''}`}
          onClick={handleExportDOCX}
          disabled={isExporting}
        >
          <span className="export-icon docx-icon">📝</span>
          <span className="export-text">
            {isExporting && exportType === 'DOCX' ? 'Exporting...' : 'Export to DOCX'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default ExportToolbar;