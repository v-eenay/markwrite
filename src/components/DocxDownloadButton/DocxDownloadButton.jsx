import { useState } from 'react';
import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Packer,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  TableLayoutType,
  VerticalAlign,
  HeightRule
} from 'docx';
import { saveAs } from 'file-saver';
import { DocxIcon } from '../icons/ToolbarIcons';
import { marked } from 'marked';
import PreviewModal from '../PreviewModal/PreviewModal';
import { useTheme } from '../../contexts/ThemeContext';

function DocxDownloadButton({ markdown }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const { theme } = useTheme();
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const getFilename = () => {
    const headingMatch = markdown.match(/^# (.+)$/m);
    if (headingMatch && headingMatch[1]) {
      return `${headingMatch[1].replace(/[^a-z0-9]/gi, '-').toLowerCase()}.docx`;
    }
    return 'markwrite-document.docx';
  };

  const parseMarkdownToDocElements = (markdownContent) => {
    // Process page breaks first - ensure proper spacing
    let processedMarkdown = markdownContent.replace(/---pagebreak---/g, '\n\n[PAGE_BREAK]\n\n');

    const lines = processedMarkdown.split('\n');
    const elements = [];
    let inCodeBlock = false;
    let codeBlockContent = '';
    let listItems = [];
    let inList = false;
    let codeBlockLanguage = '';
    let inTable = false;
    let tableRows = [];
    let tableHeaders = [];
    let inBlockItalic = false;
    let blockItalicContent = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.trim() === '[PAGE_BREAK]') {
        elements.push(
          new Paragraph({
            text: '',
            pageBreakBefore: true,
          })
        );
        continue;
      }

      if (line.startsWith('```')) {
        if (inCodeBlock) {
          const codeRuns = [];
          if (codeBlockLanguage) {
            codeRuns.push(
              new TextRun({
                text: `Language: ${codeBlockLanguage}\n`,
                bold: true,
                font: 'Courier New',
                size: 18,
                color: '0550AE',
              })
            );
          }

          const codeLines = codeBlockContent.split('\n');
          codeLines.forEach((codeLine, index) => {
            let processedLine = codeLine;
            const hasMoreLines = index < codeLines.length - 1;

            if (codeBlockLanguage === 'javascript' || codeBlockLanguage === 'typescript') {
              processedLine = processedLine.replace(
                /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|try|catch|throw|new|this|super|extends|implements)\b/g,
                (match) => {
                  codeRuns.push(
                    new TextRun({
                      text: match,
                      font: 'Courier New',
                      size: 20,
                      color: '0550AE',
                      bold: true,
                    })
                  );
                  return '';
                }
              );
              processedLine = processedLine.replace(
                /(['"`])(.*?)\1/g,
                (match, quote, content) => {
                  codeRuns.push(
                    new TextRun({
                      text: quote + content + quote,
                      font: 'Courier New',
                      size: 20,
                      color: '2E7D32',
                    })
                  );
                  return '';
                }
              );
              processedLine = processedLine.replace(
                /\/\/(.*?)$/g,
                (match, comment) => {
                  codeRuns.push(
                    new TextRun({
                      text: '//' + comment,
                      font: 'Courier New',
                      size: 20,
                      color: '5D6C79',
                      italics: true,
                    })
                  );
                  return '';
                }
              );
            } else if (codeBlockLanguage === 'python') {
              processedLine = processedLine.replace(
                /\b(def|class|import|from|as|return|if|elif|else|for|while|try|except|finally|with|in|is|not|and|or|True|False|None)\b/g,
                (match) => {
                  codeRuns.push(
                    new TextRun({
                      text: match,
                      font: 'Courier New',
                      size: 20,
                      color: '0550AE',
                      bold: true,
                    })
                  );
                  return '';
                }
              );
              processedLine = processedLine.replace(
                /(['"])(.*?)\1/g,
                (match, quote, content) => {
                  codeRuns.push(
                    new TextRun({
                      text: quote + content + quote,
                      font: 'Courier New',
                      size: 20,
                      color: '2E7D32',
                    })
                  );
                  return '';
                }
              );
              processedLine = processedLine.replace(
                /#(.*?)$/g,
                (match, comment) => {
                  codeRuns.push(
                    new TextRun({
                      text: '#' + comment,
                      font: 'Courier New',
                      size: 20,
                      color: '5D6C79',
                      italics: true,
                    })
                  );
                  return '';
                }
              );
            }

            if (processedLine.trim()) {
              codeRuns.push(
                new TextRun({
                  text: processedLine,
                  font: 'Courier New',
                  size: 20,
                  color: '333333',
                })
              );
            }

            if (hasMoreLines) {
              codeRuns.push(
                new TextRun({
                  text: '\n',
                  font: 'Courier New',
                  size: 20,
                })
              );
            }
          });

          elements.push(
            new Paragraph({
              children: codeRuns,
              spacing: { before: 240, after: 240 },
              indent: { left: 720 },
              shading: { type: 'solid', color: 'F8F9FA' },
              border: {
                top: { style: 'single', size: 1, color: 'E9ECEF' },
                bottom: { style: 'single', size: 1, color: 'E9ECEF' },
                left: { style: 'single', size: 1, color: 'E9ECEF' },
                right: { style: 'single', size: 1, color: 'E9ECEF' },
              },
            })
          );
          codeBlockContent = '';
          codeBlockLanguage = '';
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
          const langMatch = line.match(/^```(\w+)$/);
          if (langMatch && langMatch[1]) {
            codeBlockLanguage = langMatch[1];
          }
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent += line + '\n';
        continue;
      }

      if (line.trim() === '*' && !inBlockItalic) {
        inBlockItalic = true;
        continue;
      } else if (line.trim() === '*' && inBlockItalic) {
        if (blockItalicContent.trim()) {
          elements.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: blockItalicContent.trim(),
                  italics: true,
                }),
              ],
              spacing: { before: 120, after: 120 },
            })
          );
        }
        blockItalicContent = '';
        inBlockItalic = false;
        continue;
      } else if (inBlockItalic) {
        blockItalicContent += line + '\n';
        continue;
      }

      const tableHeaderMatch = line.match(/^\|(.*)\|$/);
      if (tableHeaderMatch && !inTable) {
        inTable = true;
        tableHeaders = tableHeaderMatch[1].split('|').map(header => header.trim());
        continue;
      }

      const tableSeparatorMatch = line.match(/^\|([\s\-:|]+)\|$/);
      if (tableSeparatorMatch && inTable) {
        continue;
      }

      const tableRowMatch = line.match(/^\|(.*)\|$/);
      if (tableRowMatch && inTable) {
        tableRows.push(tableRowMatch[1].split('|').map(cell => cell.trim()));
        continue;
      }

      if (inTable && (!line.trim() || !line.startsWith('|'))) {
        if (tableHeaders.length > 0 && tableRows.length > 0) {
          const columnCount = tableHeaders.length;
          const columnWidths = Array(columnCount).fill(Math.floor(9000 / columnCount));

          const processMarkdownText = (text) => {
            const runs = [];
            let processedText = text;
            processedText = processedText.replace(
              /(\*\*|__)(.*?)\1/g,
              (match, delimiter, content) => {
                runs.push(new TextRun({ text: content, bold: true }));
                return '';
              }
            );
            processedText = processedText.replace(
              /(\*|_)(.*?)\1/g,
              (match, delimiter, content) => {
                runs.push(new TextRun({ text: content, italics: true }));
                return '';
              }
            );
            processedText = processedText.replace(
              /`(.*?)`/g,
              (match, content) => {
                runs.push(
                  new TextRun({
                    text: content,
                    font: 'Courier New',
                    size: 20,
                    shading: { type: 'solid', color: 'F5F5F5' },
                  })
                );
                return '';
              }
            );
            if (processedText) {
              runs.push(new TextRun({ text: processedText }));
            }
            return runs.length > 0 ? runs : [new TextRun({ text })];
          };

          const tableObject = new Table({
            rows: [
              new TableRow({
                tableHeader: true,
                children: tableHeaders.map((header, index) =>
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: processMarkdownText(header),
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 80, after: 80 },
                      }),
                    ],
                    shading: { fill: 'F2F2F2' },
                    width: { size: columnWidths[index], type: WidthType.DXA },
                    verticalAlign: VerticalAlign.CENTER,
                  })
                ),
                height: { value: 400, rule: HeightRule.ATLEAST },
              }),
              ...tableRows.map(row =>
                new TableRow({
                  children: row.map((cell, index) =>
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: processMarkdownText(cell),
                          spacing: { before: 80, after: 80 },
                        }),
                      ],
                      width: { size: columnWidths[index], type: WidthType.DXA },
                    })
                  ),
                })
              ),
            ],
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            margins: {
              top: 120,
              bottom: 120,
              right: 120,
              left: 120,
            },
            layout: TableLayoutType.FIXED,
            borders: {
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
              insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
              top: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
              left: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
              right: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
            },
          });
          elements.push(tableObject);
        }
        inTable = false;
        tableHeaders = [];
        tableRows = [];
        if (line.trim()) {
          i--;
        }
        continue;
      }

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
      } else if (line.match(/^[\s]*[-*+][\s]+/)) {
        const indentMatch = line.match(/^(\s*)/);
        const indentLevel = indentMatch ? Math.floor(indentMatch[1].length / 2) : 0;
        const listText = line.replace(/^[\s]*[-*+][\s]+/, '');
        const processedRuns = [];
        let processedText = listText;
        processedText = processedText.replace(
          /(\*\*|__)(.*?)\1/g,
          (match, delimiter, content) => {
            processedRuns.push(new TextRun({ text: content, bold: true }));
            return '';
          }
        );
        processedText = processedText.replace(
          /(\*|_)(.*?)\1/g,
          (match, delimiter, content) => {
            processedRuns.push(new TextRun({ text: content, italics: true }));
            return '';
          }
        );
        processedText = processedText.replace(
          /`(.*?)`/g,
          (match, content) => {
            processedRuns.push(
              new TextRun({
                text: content,
                font: 'Courier New',
                size: 20,
                shading: { type: 'solid', color: 'F5F5F5' },
              })
            );
            return '';
          }
        );
        if (processedText) {
          processedRuns.push(new TextRun({ text: processedText }));
        }
        if (!inList) {
          inList = true;
          listItems = [];
        }
        listItems.push(
          new Paragraph({
            children: processedRuns.length > 0 ? processedRuns : [new TextRun({ text: listText })],
            bullet: { level: indentLevel },
            spacing: { before: 80, after: 80 },
            indent: { left: 720 * (indentLevel + 1), hanging: 360 },
          })
        );
      } else if (line.match(/^[\s]*\d+\.[\s]+/)) {
        const indentMatch = line.match(/^(\s*)/);
        const indentLevel = indentMatch ? Math.floor(indentMatch[1].length / 2) : 0;
        const listText = line.replace(/^[\s]*\d+\.[\s]+/, '');
        const processedRuns = [];
        let processedText = listText;
        processedText = processedText.replace(
          /(\*\*|__)(.*?)\1/g,
          (match, delimiter, content) => {
            processedRuns.push(new TextRun({ text: content, bold: true }));
            return '';
          }
        );
        processedText = processedText.replace(
          /(\*|_)(.*?)\1/g,
          (match, delimiter, content) => {
            processedRuns.push(new TextRun({ text: content, italics: true }));
            return '';
          }
        );
        processedText = processedText.replace(
          /`(.*?)`/g,
          (match, content) => {
            processedRuns.push(
              new TextRun({
                text: content,
                font: 'Courier New',
                size: 20,
                shading: { type: 'solid', color: 'F5F5F5' },
              })
            );
            return '';
          }
        );
        if (processedText) {
          processedRuns.push(new TextRun({ text: processedText }));
        }
        if (!inList) {
          inList = true;
          listItems = [];
        }
        listItems.push(
          new Paragraph({
            children: processedRuns.length > 0 ? processedRuns : [new TextRun({ text: listText })],
            numbering: { reference: 'default-numbering', level: indentLevel },
            spacing: { before: 80, after: 80 },
            indent: { left: 720 * (indentLevel + 1), hanging: 360 },
          })
        );
      } else if (line.startsWith('> ')) {
        elements.push(
          new Paragraph({
            children: [new TextRun({ text: line.substring(2), italics: true })],
            indent: { left: 720 },
            spacing: { before: 120, after: 120 },
            border: { left: { style: 'single', size: 4, color: 'CCCCCC' } },
          })
        );
      } else if (line.startsWith('---') || line.startsWith('***') || line.startsWith('___')) {
        elements.push(
          new Paragraph({
            children: [new TextRun({ text: '' })],
            thematicBreak: true,
            spacing: { before: 240, after: 240 },
          })
        );
      } else if (line.trim() === '') {
        if (inList) {
          elements.push(...listItems);
          listItems = [];
          inList = false;
        }
        elements.push(new Paragraph({ text: '' }));
      } else {
        if (inList) {
          elements.push(...listItems);
          listItems = [];
          inList = false;
        }
        const runs = [];
        let currentText = line;

        currentText = currentText.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, src) => {
          // Placeholder for images, actual image handling would require fetching and embedding
          runs.push(new TextRun({ text: `[Image: ${alt} at ${src}]`, color: '0000FF', underline: {} }));
          return '';
        });

        currentText = currentText.replace(/\[(.*?)\]\((.*?)\)/g, (match, text, url) => {
          runs.push(new TextRun({ text: text, style: 'Hyperlink', color: '0000FF', underline: {} }));
          // Note: Actual hyperlink functionality in DOCX requires more setup
          return '';
        });

        currentText = currentText.replace(/(\*{1,2}|_{1,2})(.*?)\1/g, (match, delimiter, text) => {
          runs.push(new TextRun({ text, bold: delimiter.length === 2, italics: delimiter.length === 1 }));
          return '';
        });

        currentText = currentText.replace(/`(.*?)`/g, (match, code) => {
          runs.push(new TextRun({ text: code, font: 'Courier New', shading: { type: 'solid', color: 'F5F5F5' } }));
          return '';
        });

        if (currentText) {
          runs.push(new TextRun({ text: currentText }));
        }

        elements.push(new Paragraph({ children: runs, spacing: { after: 120 } }));
      }
    }

    if (inList) {
      elements.push(...listItems);
    }
    if (inCodeBlock) { // Handle unclosed code block at EOF
        elements.push(new Paragraph({ children: [new TextRun({ text: codeBlockContent, font: 'Courier New' })]}));
    }
    if (inBlockItalic) { // Handle unclosed block italic at EOF
        elements.push(new Paragraph({ children: [new TextRun({ text: blockItalicContent, italics: true })]}));
    }

    return elements;
  };

  const handleDownload = async () => {
    if (!markdown || markdown.trim() === '') {
      setError('Cannot generate DOCX from empty content.');
      return;
    }
    setError(null);
    setIsGenerating(true);

    try {
      const docElements = parseMarkdownToDocElements(markdown);
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: docElements,
          },
        ],
        numbering: {
          config: [
            {
              reference: 'default-numbering',
              levels: [
                {
                  level: 0,
                  format: 'decimal',
                  text: '%1.',
                  alignment: AlignmentType.LEFT,
                  style: { paragraph: { indent: { left: 720, hanging: 360 } } },
                },
                {
                  level: 1,
                  format: 'lowerLetter',
                  text: '%2.',
                  alignment: AlignmentType.LEFT,
                  style: { paragraph: { indent: { left: 1440, hanging: 360 } } },
                },
              ],
            },
          ],
        },
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, getFilename());
    } catch (err) {
      console.error('Error generating DOCX:', err);
      setError(`Failed to generate DOCX: ${err.message || String(err)}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenPreview = () => {
    if (!markdown || markdown.trim() === '') {
      setError('Markdown content is empty. Cannot generate preview.');
      return;
    }
    setError(null);
    setIsPreviewModalOpen(true);
  };

  const handleClosePreview = () => setIsPreviewModalOpen(false);

  const handleConfirmDownload = async () => {
    setIsPreviewModalOpen(false);
    await handleDownload();
  };

  return (
    <>
      {/* Always render the PreviewModal but control visibility with isOpen prop */}
      <PreviewModal
        isOpen={isPreviewModalOpen}
        onClose={handleClosePreview}
        onConfirm={handleConfirmDownload}
        title={`Preview: ${getFilename()}`}
        theme={theme}
        content={marked(markdown || '')}
        contentType="markdown"
      />
      <div className="relative">
        <button
          onClick={handleOpenPreview}
          className="download-button group flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-primary-light dark:bg-primary-dark text-white hover:bg-primary-hover dark:hover:bg-primary-dark-hover transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed min-w-[42px]"
          disabled={isGenerating || !markdown || markdown.trim() === ''}
          title={isGenerating ? 'Generating DOCX...' : 'Download as DOCX'}
          aria-busy={isGenerating}
          aria-disabled={isGenerating || !markdown || markdown.trim() === ''}
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="ml-1 font-medium">Generating...</span>
            </>
          ) : (
            <>
              <DocxIcon className="h-5 w-5 flex-shrink-0" />
              <span className="hidden group-hover:inline-block transition-all duration-300 font-medium">Download DOCX</span>
            </>
          )}
        </button>
        {error && (
          <div className="absolute left-0 top-full mt-2 w-full max-w-xs z-10">
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-3 py-2 rounded-md shadow-lg text-xs break-words">
              <p className="font-semibold">Error:</p>
              <p>{error}</p>
              <button
                className="mt-2 text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
                onClick={() => setError(null)}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default DocxDownloadButton;
