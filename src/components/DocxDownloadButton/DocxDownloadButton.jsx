import { useState } from 'react';
import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer } from 'docx';
import { saveAs } from 'file-saver';
import DocxIcon from '../icons/DocxIcon';
import './DocxDownloadButton.css';

function DocxDownloadButton({ previewRef, markdown }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const getFilename = () => {
    // Try to extract the first heading from markdown
    const headingMatch = markdown.match(/^# (.+)$/m);
    if (headingMatch && headingMatch[1]) {
      // Clean the heading to make it suitable for a filename
      return `${headingMatch[1].replace(/[^a-z0-9]/gi, '-').toLowerCase()}.docx`;
    }
    return 'markwrite-document.docx';
  };

  // Helper function to parse markdown into document elements
  const parseMarkdownToDocElements = (markdown) => {
    const lines = markdown.split('\n');
    const elements = [];
    let inCodeBlock = false;
    let codeBlockContent = '';
    let listItems = [];
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Handle code blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          // End of code block
          elements.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: codeBlockContent,
                  font: 'Courier New',
                  size: 20,
                }),
              ],
              spacing: { before: 200, after: 200 },
              indent: { left: 720 }, // 0.5 inch
              shading: { type: 'solid', color: 'F5F5F5' },
            })
          );
          codeBlockContent = '';
          inCodeBlock = false;
        } else {
          // Start of code block
          inCodeBlock = true;
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent += line + '\n';
        continue;
      }

      // Handle headings
      if (line.startsWith('# ')) {
        elements.push(
          new Paragraph({
            text: line.substring(2),
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120 },
          })
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          new Paragraph({
            text: line.substring(3),
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120 },
          })
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          new Paragraph({
            text: line.substring(4),
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 240, after: 120 },
          })
        );
      }
      // Handle lists
      else if (line.match(/^[\s]*[-*+][\s]+/)) {
        const listText = line.replace(/^[\s]*[-*+][\s]+/, '');
        if (!inList) {
          inList = true;
          listItems = [];
        }
        listItems.push(
          new Paragraph({
            text: listText,
            bullet: { level: 0 },
            spacing: { before: 80, after: 80 },
          })
        );
      }
      // Handle numbered lists
      else if (line.match(/^[\s]*\d+\.[\s]+/)) {
        const listText = line.replace(/^[\s]*\d+\.[\s]+/, '');
        if (!inList) {
          inList = true;
          listItems = [];
        }
        listItems.push(
          new Paragraph({
            text: listText,
            numbering: { reference: 1, level: 0 },
            spacing: { before: 80, after: 80 },
          })
        );
      }
      // Handle blockquotes
      else if (line.startsWith('> ')) {
        elements.push(
          new Paragraph({
            text: line.substring(2),
            indent: { left: 720 },
            spacing: { before: 120, after: 120 },
            border: { left: { style: 'single', size: 4, color: '999999' } },
            style: 'Quote',
          })
        );
      }
      // Handle regular paragraphs
      else if (line.trim() !== '') {
        // Process inline formatting
        const runs = [];
        let currentText = '';
        let isBold = false;
        let isItalic = false;
        let isCode = false;
        let isStrikethrough = false;

        // Very simple inline formatting - not handling nested formatting
        for (let j = 0; j < line.length; j++) {
          // Handle bold (** **)
          if (line[j] === '*' && line[j + 1] === '*' && !isCode) {
            if (currentText) {
              runs.push(
                new TextRun({
                  text: currentText,
                  bold: isBold,
                  italics: isItalic,
                  strike: isStrikethrough,
                })
              );
              currentText = '';
            }
            isBold = !isBold;
            j++; // Skip the next asterisk
          }
          // Handle italic (* *)
          else if (line[j] === '*' && !isCode) {
            if (currentText) {
              runs.push(
                new TextRun({
                  text: currentText,
                  bold: isBold,
                  italics: isItalic,
                  strike: isStrikethrough,
                })
              );
              currentText = '';
            }
            isItalic = !isItalic;
          }
          // Handle strikethrough (~~ ~~)
          else if (line[j] === '~' && line[j + 1] === '~' && !isCode) {
            if (currentText) {
              runs.push(
                new TextRun({
                  text: currentText,
                  bold: isBold,
                  italics: isItalic,
                  strike: isStrikethrough,
                })
              );
              currentText = '';
            }
            isStrikethrough = !isStrikethrough;
            j++; // Skip the next tilde
          }
          // Handle inline code (` `)
          else if (line[j] === '`' && !isCode) {
            if (currentText) {
              runs.push(
                new TextRun({
                  text: currentText,
                  bold: isBold,
                  italics: isItalic,
                  strike: isStrikethrough,
                })
              );
              currentText = '';
            }
            isCode = true;
          } else if (line[j] === '`' && isCode) {
            if (currentText) {
              runs.push(
                new TextRun({
                  text: currentText,
                  font: 'Courier New',
                  size: 20,
                })
              );
              currentText = '';
            }
            isCode = false;
          } else {
            currentText += line[j];
          }
        }

        if (currentText) {
          runs.push(
            new TextRun({
              text: currentText,
              bold: isBold,
              italics: isItalic,
              strike: isStrikethrough,
              font: isCode ? 'Courier New' : undefined,
              size: isCode ? 20 : undefined,
            })
          );
        }

        elements.push(
          new Paragraph({
            children: runs,
            spacing: { before: 120, after: 120 },
          })
        );
      } else if (line.trim() === '' && !inList) {
        // Empty line - add a paragraph break
        elements.push(new Paragraph({}));
      }

      // If we're at the end of a list or moving to a new paragraph
      if ((inList && (line.trim() === '' || !line.match(/^[\s]*[-*+\d\.][\s]+/)))) {
        elements.push(...listItems);
        listItems = [];
        inList = false;
      }
    }

    // Add any remaining list items
    if (listItems.length > 0) {
      elements.push(...listItems);
    }

    return elements;
  };

  const handleDownloadDocx = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      // Create a new document
      const doc = new Document({
        numbering: {
          config: [
            {
              reference: 1,
              levels: [
                {
                  level: 0,
                  format: 'decimal',
                  text: '%1.',
                  alignment: AlignmentType.START,
                  style: {
                    paragraph: {
                      indent: { left: 720, hanging: 260 },
                    },
                  },
                },
              ],
            },
          ],
        },
        sections: [
          {
            properties: {},
            children: parseMarkdownToDocElements(markdown),
          },
        ],
      });

      // Generate the DOCX file
      const blob = await Packer.toBlob(doc);

      // Save the file using file-saver
      saveAs(blob, getFilename());

      console.log('DOCX generated successfully');
    } catch (err) {
      console.error('Error generating DOCX:', err);
      setError('Failed to generate DOCX. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="docx-download-container">
      <button
        className={`docx-download-button ${isGenerating ? 'generating' : ''}`}
        onClick={handleDownloadDocx}
        disabled={isGenerating}
        title="Download as DOCX"
      >
        <DocxIcon className="docx-icon" />
        <span>Download DOCX</span>
        {isGenerating && <span className="loading-spinner"></span>}
      </button>
      {error && <div className="docx-error-message">{error}</div>}
    </div>
  );
}

export default DocxDownloadButton;
