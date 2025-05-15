import React from 'react';
import { marked } from 'marked'; // Or your preferred markdown parser

function PreviewModal({ isOpen, onClose, onConfirm, content, contentType = 'html', title = 'Download Preview' }) {
  if (!isOpen) {
    return null;
  }

  // PDF-specific styles to be applied to the preview content
  const pdfPreviewStyles = `
    .pdf-preview {
      font-family: 'Arial', 'Helvetica', sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #fff;
      font-size: 11pt;
      padding: 15mm;
      max-width: 210mm; /* A4 width */
      margin: 0 auto;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      border-radius: 4px;
    }
    .pdf-preview h1, .pdf-preview h2, .pdf-preview h3,
    .pdf-preview h4, .pdf-preview h5, .pdf-preview h6 {
      margin-top: 1.2em;
      margin-bottom: 0.6em;
      color: #2f3e46;
      font-weight: 600;
      line-height: 1.3;
    }
    .pdf-preview h1 {
      font-size: 2em;
      border-bottom: 1px solid #eaecef;
      padding-bottom: 0.3em;
    }
    .pdf-preview h2 {
      font-size: 1.5em;
      border-bottom: 1px solid #eaecef;
      padding-bottom: 0.3em;
    }
    .pdf-preview h3 { font-size: 1.25em; }
    .pdf-preview h4 { font-size: 1em; }

    .pdf-preview p {
      margin-bottom: 0.8em;
      margin-top: 0;
      text-align: justify;
      color: #333;
      line-height: 1.6;
    }

    .pdf-preview strong, .pdf-preview b {
      font-weight: 600;
      color: #24292e;
    }
    .pdf-preview em, .pdf-preview i {
      font-style: italic;
    }

    .pdf-preview del, .pdf-preview s {
      text-decoration: line-through;
      color: #666;
    }

    .pdf-preview code:not(pre code) {
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

    .pdf-preview pre {
      background-color: #f8f9fa;
      border-radius: 6px;
      padding: 1em;
      margin: 1em 0;
      overflow-x: auto;
      border: 1px solid #e9ecef;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    .pdf-preview pre code {
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

    .pdf-preview img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 1em auto;
    }

    .pdf-preview ul, .pdf-preview ol {
      padding-left: 2em;
      margin: 1em 0;
    }
    .pdf-preview li {
      margin-bottom: 0.5em;
    }
    .pdf-preview li > ul, .pdf-preview li > ol {
      margin: 0.5em 0;
    }

    .pdf-preview blockquote {
      border-left: 4px solid #6b7280;
      padding: 0.5em 1em;
      margin: 1em 0;
      background-color: #f9fafb;
      color: #4b5563;
      font-style: italic;
      display: block;
    }
    .pdf-preview blockquote p {
      margin: 0.5em 0;
      text-align: left;
    }

    .pdf-preview table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
      border: 1px solid #e5e7eb;
      table-layout: fixed;
    }
    .pdf-preview th, .pdf-preview td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    .pdf-preview th {
      background-color: #f2f2f2;
      font-weight: 600;
    }
    .pdf-preview tr:nth-child(even) {
      background-color: #f9fafb;
    }

    .pdf-preview hr {
      border: 0;
      border-top: 1px solid #eaecef;
      margin: 1.5em 0;
      height: 0;
    }

    .pdf-preview a {
      color: #0366d6;
      text-decoration: underline;
    }
  `;

  let previewContent;
  if (contentType === 'markdown') {
    // Sanitize the HTML output from marked
    const rawMarkup = marked.parse(content || '', { breaks: true, gfm: true });
    // A basic sanitizer, consider a more robust one like DOMPurify for production
    const sanitizedMarkup = rawMarkup.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    previewContent = (
      <>
        <style>{pdfPreviewStyles}</style>
        <div
          dangerouslySetInnerHTML={{ __html: sanitizedMarkup }}
          className="pdf-preview overflow-auto max-h-[60vh] border rounded"
        />
      </>
    );
  } else if (contentType === 'html') {
    previewContent = (
      <>
        <style>{pdfPreviewStyles}</style>
        <div
          dangerouslySetInnerHTML={{ __html: content }}
          className="pdf-preview overflow-auto max-h-[60vh] border rounded"
        />
      </>
    );
  } else {
    previewContent = (
      <>
        <style>{pdfPreviewStyles}</style>
        <div className="pdf-preview overflow-auto max-h-[60vh] border rounded">
          {content}
        </div>
      </>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background-light dark:bg-background-dark rounded-lg shadow-xl p-6 w-full max-w-2xl">
        <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-4">Download Preview</h2>
        <div className="mb-4">
          {previewContent}
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text-secondary dark:text-text-dark-secondary bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors duration-200"
          >
            Confirm Download
          </button>
        </div>
      </div>
    </div>
  );
}

export default PreviewModal;