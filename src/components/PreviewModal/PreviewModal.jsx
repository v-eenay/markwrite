import React from 'react';
import { marked } from 'marked'; // Or your preferred markdown parser

function PreviewModal({ isOpen, onClose, onConfirm, content, contentType = 'html', title = 'Download Preview' }) {
  if (!isOpen) {
    return null;
  }

  // PDF-specific styles to be applied to the preview content
  const pdfPreviewStyles = `
    /* Force light mode for PDF preview regardless of current theme */
    .pdf-preview {
      font-family: 'Arial', 'Helvetica', sans-serif;
      line-height: 1.6;
      color: #333 !important;
      background-color: #fff !important;
      font-size: 11pt;
      padding: 15mm;
      max-width: 210mm; /* A4 width */
      margin: 0 auto;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      border-radius: 4px;
    }

    /* Override any dark mode styles that might be applied */
    .pdf-preview * {
      color: inherit;
      background-color: transparent;
    }

    .pdf-preview h1, .pdf-preview h2, .pdf-preview h3,
    .pdf-preview h4, .pdf-preview h5, .pdf-preview h6 {
      margin-top: 1.2em;
      margin-bottom: 0.6em;
      color: #2f3e46 !important;
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
      color: #333 !important;
      line-height: 1.6;
    }

    .pdf-preview strong, .pdf-preview b {
      font-weight: 600;
      color: #24292e !important;
    }
    .pdf-preview em, .pdf-preview i {
      font-style: italic;
      color: #333 !important;
    }

    .pdf-preview del, .pdf-preview s {
      text-decoration: line-through;
      color: #666 !important;
    }

    .pdf-preview code:not(pre code) {
      font-family: 'Courier New', Courier, monospace;
      font-size: 0.9em;
      color: #d63384 !important;
      background-color: rgba(214, 51, 132, 0.05) !important;
      border-radius: 3px;
      border: 1px solid rgba(214, 51, 132, 0.1);
      padding: 0.1em 0.4em;
      white-space: normal;
      word-wrap: break-word;
    }

    .pdf-preview pre {
      background-color: #f8f9fa !important;
      border-radius: 6px;
      padding: 1em;
      margin: 1em 0;
      overflow-x: auto;
      border: 1px solid #e9ecef;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    .pdf-preview pre code {
      padding: 0;
      background-color: transparent !important;
      border-radius: 0;
      display: block;
      white-space: pre;
      color: #333 !important;
      font-size: 0.9em;
      border: none;
      font-weight: normal;
      font-family: 'Courier New', Courier, monospace;
      line-height: 1.5;
    }

    /* Syntax highlighting for code blocks */
    .pdf-preview .hljs-keyword,
    .pdf-preview .hljs-selector-tag,
    .pdf-preview .hljs-addition {
      color: #0550ae !important;
      font-weight: bold;
    }
    .pdf-preview .hljs-number,
    .pdf-preview .hljs-string,
    .pdf-preview .hljs-meta .hljs-meta-string,
    .pdf-preview .hljs-literal,
    .pdf-preview .hljs-doctag,
    .pdf-preview .hljs-regexp {
      color: #2e7d32 !important;
    }
    .pdf-preview .hljs-title,
    .pdf-preview .hljs-section,
    .pdf-preview .hljs-name,
    .pdf-preview .hljs-selector-id,
    .pdf-preview .hljs-selector-class {
      color: #d32f2f !important;
    }
    .pdf-preview .hljs-attribute,
    .pdf-preview .hljs-attr,
    .pdf-preview .hljs-variable,
    .pdf-preview .hljs-template-variable,
    .pdf-preview .hljs-class .hljs-title,
    .pdf-preview .hljs-type {
      color: #e65100 !important;
    }
    .pdf-preview .hljs-symbol,
    .pdf-preview .hljs-bullet,
    .pdf-preview .hljs-subst,
    .pdf-preview .hljs-meta,
    .pdf-preview .hljs-meta .hljs-keyword,
    .pdf-preview .hljs-selector-attr,
    .pdf-preview .hljs-selector-pseudo,
    .pdf-preview .hljs-link {
      color: #7b1fa2 !important;
    }
    .pdf-preview .hljs-built_in,
    .pdf-preview .hljs-deletion {
      color: #0277bd !important;
    }
    .pdf-preview .hljs-comment,
    .pdf-preview .hljs-quote {
      color: #5d6c79 !important;
      font-style: italic;
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
      color: #333 !important;
    }
    .pdf-preview li {
      margin-bottom: 0.5em;
      color: #333 !important;
    }
    .pdf-preview li > ul, .pdf-preview li > ol {
      margin: 0.5em 0;
    }

    .pdf-preview blockquote {
      border-left: 4px solid #6b7280;
      padding: 0.5em 1em;
      margin: 1em 0;
      background-color: #f9fafb !important;
      color: #4b5563 !important;
      font-style: italic;
      display: block;
    }
    .pdf-preview blockquote p {
      margin: 0.5em 0;
      text-align: left;
      color: #4b5563 !important;
    }

    .pdf-preview table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
      border: 1px solid #e5e7eb;
      table-layout: fixed;
      color: #333 !important;
    }
    .pdf-preview th, .pdf-preview td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
      word-wrap: break-word;
      overflow-wrap: break-word;
      color: #333 !important;
    }
    .pdf-preview th {
      background-color: #f2f2f2 !important;
      font-weight: 600;
      color: #333 !important;
    }
    .pdf-preview tr:nth-child(even) {
      background-color: #f9fafb !important;
    }
    .pdf-preview tr:nth-child(odd) {
      background-color: #ffffff !important;
    }

    .pdf-preview hr {
      border: 0;
      border-top: 1px solid #eaecef;
      margin: 1.5em 0;
      height: 0;
    }

    .pdf-preview a {
      color: #0366d6 !important;
      text-decoration: underline;
    }

    /* Ensure all spans and other inline elements have proper color */
    .pdf-preview span,
    .pdf-preview small,
    .pdf-preview mark,
    .pdf-preview cite,
    .pdf-preview abbr,
    .pdf-preview time,
    .pdf-preview sub,
    .pdf-preview sup {
      color: #333 !important;
    }
  `;

  // Add DOCX-specific styles for preview
  const docxPreviewStyles = `
    .docx-preview {
      font-family: 'Calibri', 'Arial', sans-serif;
      line-height: 1.5;
      color: #333333;
      background-color: #ffffff;
      padding: 25mm;
      max-width: 210mm; /* A4 width */
      margin: 0 auto;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      border-radius: 4px;
    }

    .docx-preview h1, .docx-preview h2, .docx-preview h3,
    .docx-preview h4, .docx-preview h5, .docx-preview h6 {
      margin-top: 1.2em;
      margin-bottom: 0.6em;
      color: #2F3E46;
      font-weight: 600;
      line-height: 1.3;
    }

    .docx-preview h1 {
      font-size: 1.8em;
      border-bottom: 1px solid #EAECEF;
      padding-bottom: 0.3em;
    }

    .docx-preview h2 {
      font-size: 1.5em;
      border-bottom: 1px solid #EAECEF;
      padding-bottom: 0.3em;
    }

    .docx-preview h3 { font-size: 1.25em; }

    .docx-preview p {
      margin-bottom: 0.8em;
      margin-top: 0;
    }

    .docx-preview ul, .docx-preview ol {
      padding-left: 2em;
      margin: 1em 0;
      list-style-position: outside;
    }

    .docx-preview li {
      margin-bottom: 0.5em;
      display: list-item;
      line-height: 1.6;
    }

    .docx-preview ul {
      list-style-type: disc;
    }

    .docx-preview ul ul {
      list-style-type: circle;
    }

    .docx-preview ul ul ul {
      list-style-type: square;
    }

    .docx-preview ol {
      list-style-type: decimal;
    }

    .docx-preview ol ol {
      list-style-type: lower-alpha;
    }

    .docx-preview ol ol ol {
      list-style-type: lower-roman;
    }

    .docx-preview pre {
      background-color: #F8F9FA;
      border: 1px solid #E9ECEF;
      border-radius: 4px;
      padding: 1em;
      margin: 1em 0;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
      overflow-x: auto;
      white-space: pre-wrap;
    }

    .docx-preview code {
      font-family: 'Courier New', monospace;
      background-color: #F5F5F5;
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-size: 0.9em;
    }

    .docx-preview blockquote {
      border-left: 4px solid #6B7280;
      padding: 0.5em 1em;
      margin: 1em 0;
      background-color: #F9FAFB;
      color: #4B5563;
      font-style: italic;
    }

    .docx-preview table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
    }

    .docx-preview th, .docx-preview td {
      border: 1px solid #DDD;
      padding: 8px;
      text-align: left;
    }

    .docx-preview th {
      background-color: #F2F2F2;
      font-weight: bold;
    }

    .docx-preview tr:nth-child(even) {
      background-color: #F9FAFB;
    }

    .docx-preview img {
      max-width: 100%;
      height: auto;
    }

    .docx-preview a {
      color: #0366D6;
      text-decoration: underline;
    }

    .docx-preview hr {
      border: 0;
      border-top: 1px solid #EAECEF;
      margin: 1.5em 0;
    }
  `;

  let previewContent;
  const isDocx = title && title.toLowerCase().includes('docx');

  if (contentType === 'markdown') {
    // Sanitize the HTML output from marked
    const rawMarkup = marked.parse(content || '', { breaks: true, gfm: true });
    // A basic sanitizer, consider a more robust one like DOMPurify for production
    const sanitizedMarkup = rawMarkup.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    previewContent = (
      <>
        <style>{isDocx ? docxPreviewStyles : pdfPreviewStyles}</style>
        <div
          dangerouslySetInnerHTML={{ __html: sanitizedMarkup }}
          className={isDocx ? "docx-preview overflow-auto max-h-[60vh] border rounded" : "pdf-preview overflow-auto max-h-[60vh] border rounded"}
        />
      </>
    );
  } else if (contentType === 'html') {
    previewContent = (
      <>
        <style>{isDocx ? docxPreviewStyles : pdfPreviewStyles}</style>
        <div
          dangerouslySetInnerHTML={{ __html: content }}
          className={isDocx ? "docx-preview overflow-auto max-h-[60vh] border rounded" : "pdf-preview overflow-auto max-h-[60vh] border rounded"}
        />
      </>
    );
  } else {
    previewContent = (
      <>
        <style>{isDocx ? docxPreviewStyles : pdfPreviewStyles}</style>
        <div className={isDocx ? "docx-preview overflow-auto max-h-[60vh] border rounded" : "pdf-preview overflow-auto max-h-[60vh] border rounded"}>
          {content}
        </div>
      </>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background-light dark:bg-background-dark rounded-lg shadow-xl p-6 w-full max-w-2xl">
        <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-4">{title}</h2>
        <div className="mb-4 bg-white">
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