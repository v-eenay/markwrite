import html2pdf from 'html2pdf.js';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

/**
 * Convert Markdown to HTML
 * This is a simple implementation. For production, use a proper markdown parser.
 */
export const markdownToHtml = (markdown) => {
  // This is a very basic implementation
  // For a real app, use a library like marked or remark
  let html = markdown
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    .replace(/^\- (.+)$/gm, '<ul><li>$1</li></ul>')
    .replace(/^\d+\. (.+)$/gm, '<ol><li>$1</li></ol>')
    .replace(/\n\n/g, '<br/><br/>');

  return html;
};

/**
 * Export markdown content to PDF
 */
export const exportToPDF = async (markdown, filename = 'document.pdf') => {
  const html = markdownToHtml(markdown);
  
  // Create a div to render the HTML
  const element = document.createElement('div');
  element.innerHTML = html;
  element.style.padding = '20px';
  
  // Configure html2pdf options
  const options = {
    margin: 10,
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  
  try {
    // Generate PDF
    const pdf = await html2pdf().set(options).from(element).save();
    return { success: true, message: 'PDF exported successfully' };
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Export markdown content to DOCX
 */
export const exportToDOCX = async (markdown, filename = 'document.docx') => {
  try {
    // Very basic markdown to DOCX conversion
    // For a real app, use a more sophisticated approach
    const lines = markdown.split('\n');
    const paragraphs = [];
    
    for (const line of lines) {
      // Skip empty lines
      if (line.trim() === '') continue;
      
      // Very basic parsing
      if (line.startsWith('# ')) {
        // Heading 1
        paragraphs.push(
          new Paragraph({
            text: line.substring(2),
            heading: 'Heading1',
          })
        );
      } else if (line.startsWith('## ')) {
        // Heading 2
        paragraphs.push(
          new Paragraph({
            text: line.substring(3),
            heading: 'Heading2',
          })
        );
      } else {
        // Normal paragraph
        paragraphs.push(
          new Paragraph({
            children: [new TextRun(line)],
          })
        );
      }
    }
    
    // Create document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: paragraphs,
        },
      ],
    });
    
    // Generate blob
    const blob = await Packer.toBlob(doc);
    
    // Save file
    saveAs(blob, filename);
    
    return { success: true, message: 'DOCX exported successfully' };
  } catch (error) {
    console.error('Error exporting to DOCX:', error);
    return { success: false, error: error.message };
  }
};