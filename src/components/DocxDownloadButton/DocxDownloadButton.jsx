import { useState } from 'react';
import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer, Table, TableRow, TableCell, WidthType } from 'docx';
import { saveAs } from 'file-saver';
import DocxIcon from '../icons/DocxIcon';

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
    // Process page breaks first
    markdown = markdown.replace(/---pagebreak---/g, '\n\n[PAGE_BREAK]\n\n');
    
    const lines = markdown.split('\n');
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

      // Handle page breaks
      if (line.trim() === '[PAGE_BREAK]') {
        elements.push(
          new Paragraph({
            text: '',
            pageBreakBefore: true,
          })
        );
        continue;
      }

      // Handle code blocks with language detection
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          // End of code block
          elements.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: codeBlockLanguage ? `Language: ${codeBlockLanguage}\n` : '',
                  bold: true,
                  font: 'Courier New',
                  size: 18,
                }),
                new TextRun({
                  text: codeBlockContent,
                  font: 'Courier New',
                  size: 20,
                }),
              ],
              spacing: { before: 240, after: 240 },
              indent: { left: 720 }, // 0.5 inch
              shading: { type: 'solid', color: 'F5F5F5' },
              border: {
                top: { style: 'single', size: 1, color: 'DDDDDD' },
                bottom: { style: 'single', size: 1, color: 'DDDDDD' },
                left: { style: 'single', size: 1, color: 'DDDDDD' },
                right: { style: 'single', size: 1, color: 'DDDDDD' },
              },
            })
          );
          codeBlockContent = '';
          codeBlockLanguage = '';
          inCodeBlock = false;
        } else {
          // Start of code block - check for language
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
      
      // Handle block italic text (multiple lines surrounded by asterisks)
      if (line.trim() === '*' && !inBlockItalic) {
        inBlockItalic = true;
        continue;
      } else if (line.trim() === '*' && inBlockItalic) {
        // End of block italic, add the content
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
      
      // Handle tables
      // Table header row (| Header 1 | Header 2 |)
      const tableHeaderMatch = line.match(/^\|(.*)\|$/);
      if (tableHeaderMatch && !inTable) {
        // Start of a table
        inTable = true;
        tableHeaders = tableHeaderMatch[1].split('|').map(header => header.trim());
        continue;
      }
      
      // Table separator row (| ------ | ------ |)
      const tableSeparatorMatch = line.match(/^\|([\s\-:\|]+)\|$/);
      if (tableSeparatorMatch && inTable) {
        // This is the separator row, just skip it
        continue;
      }
      
      // Table data row
      const tableRowMatch = line.match(/^\|(.*)\|$/);
      if (tableRowMatch && inTable) {
        // Add a data row to the table
        tableRows.push(tableRowMatch[1].split('|').map(cell => cell.trim()));
        continue;
      }
      
      // End of table (empty line or non-table content)
      if (inTable && (!line.trim() || !line.startsWith('|'))) {
        // Create and add the table
        if (tableHeaders.length > 0 && tableRows.length > 0) {
          // Create a proper Table object from the docx library
          const tableObject = new Table({
            rows: [
              // Header row
              new TableRow({
                tableHeader: true,
                children: tableHeaders.map(header => 
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: header, bold: true })],
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                    shading: { fill: 'F2F2F2' },
                  })
                ),
              }),
              // Data rows
              ...tableRows.map(row => 
                new TableRow({
                  children: row.map(cell => 
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [new TextRun({ text: cell })],
                        }),
                      ],
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
              right: 0,
              left: 0,
            },
          });
          
          elements.push(tableObject);
        }
        
        // Reset table state
        inTable = false;
        tableHeaders = [];
        tableRows = [];
        
        // If this is not an empty line, process it normally
        if (line.trim()) {
          i--; // Reprocess this line
        }
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
        // Process inline formatting with improved regex-based approach
        let processedLine = line;
        const runs = [];
        
        // Define regex patterns for markdown formatting
        const boldPattern = /\*\*(.*?)\*\*/g;
        const italicPattern = /\*(.*?)\*/g;
        const strikethroughPattern = /~~(.*?)~~/g;
        const inlineCodePattern = /`(.*?)`/g;
        const linkPattern = /\[(.*?)\]\((.*?)\)/g;
        
        // Extract all formatting matches to create text runs
        const segments = [];
        let lastIndex = 0;
        
        // First, replace all inline code to avoid conflicts with other formatting
        const codeMatches = [];
        let codeMatch;
        while ((codeMatch = inlineCodePattern.exec(processedLine)) !== null) {
          codeMatches.push({
            start: codeMatch.index,
            end: codeMatch.index + codeMatch[0].length,
            content: codeMatch[1],
            type: 'code'
          });
        }
        
        // Then handle bold formatting
        const boldMatches = [];
        let boldMatch;
        while ((boldMatch = boldPattern.exec(processedLine)) !== null) {
          // Check if this match is inside a code block
          const isInCode = codeMatches.some(code => 
            boldMatch.index >= code.start && boldMatch.index < code.end
          );
          
          if (!isInCode) {
            boldMatches.push({
              start: boldMatch.index,
              end: boldMatch.index + boldMatch[0].length,
              content: boldMatch[1],
              type: 'bold'
            });
          }
        }
        
        // Handle italic formatting
        const italicMatches = [];
        let italicMatch;
        while ((italicMatch = italicPattern.exec(processedLine)) !== null) {
          // Skip if this is actually part of a bold pattern
          const isPartOfBold = processedLine.substring(italicMatch.index - 1, italicMatch.index + 2) === '**';
          const isInCode = codeMatches.some(code => 
            italicMatch.index >= code.start && italicMatch.index < code.end
          );
          
          if (!isPartOfBold && !isInCode) {
            italicMatches.push({
              start: italicMatch.index,
              end: italicMatch.index + italicMatch[0].length,
              content: italicMatch[1],
              type: 'italic'
            });
          }
        }
        
        // Handle strikethrough
        const strikeMatches = [];
        let strikeMatch;
        while ((strikeMatch = strikethroughPattern.exec(processedLine)) !== null) {
          const isInCode = codeMatches.some(code => 
            strikeMatch.index >= code.start && strikeMatch.index < code.end
          );
          
          if (!isInCode) {
            strikeMatches.push({
              start: strikeMatch.index,
              end: strikeMatch.index + strikeMatch[0].length,
              content: strikeMatch[1],
              type: 'strike'
            });
          }
        }
        
        // Handle links
        const linkMatches = [];
        let linkMatch;
        while ((linkMatch = linkPattern.exec(processedLine)) !== null) {
          const isInCode = codeMatches.some(code => 
            linkMatch.index >= code.start && linkMatch.index < code.end
          );
          
          if (!isInCode) {
            linkMatches.push({
              start: linkMatch.index,
              end: linkMatch.index + linkMatch[0].length,
              content: linkMatch[1],
              url: linkMatch[2],
              type: 'link'
            });
          }
        }
        
        // Combine all matches and sort by position
        const allMatches = [
          ...codeMatches,
          ...boldMatches,
          ...italicMatches,
          ...strikeMatches,
          ...linkMatches
        ].sort((a, b) => a.start - b.start);
        
        // Process the line with all formatting
        let currentPosition = 0;
        for (const match of allMatches) {
          // Add any text before this formatting
          if (match.start > currentPosition) {
            runs.push(
              new TextRun({
                text: processedLine.substring(currentPosition, match.start),
              })
            );
          }
          
          // Add the formatted text
          switch (match.type) {
            case 'bold':
              runs.push(
                new TextRun({
                  text: match.content,
                  bold: true,
                })
              );
              break;
            case 'italic':
              runs.push(
                new TextRun({
                  text: match.content,
                  italics: true,
                })
              );
              break;
            case 'strike':
              runs.push(
                new TextRun({
                  text: match.content,
                  strike: true,
                })
              );
              break;
            case 'code':
              runs.push(
                new TextRun({
                  text: match.content,
                  font: 'Courier New',
                  size: 20,
                  shading: { type: 'solid', color: 'F5F5F5' },
                })
              );
              break;
            case 'link':
              runs.push(
                new TextRun({
                  text: match.content,
                  color: '0000FF',
                  underline: true,
                })
              );
              break;
          }
          
          currentPosition = match.end;
        }
        
        // Add any remaining text
        if (currentPosition < processedLine.length) {
          runs.push(
            new TextRun({
              text: processedLine.substring(currentPosition),
            })
          );
        }
        
        // If no formatting was found, add the whole line as plain text
        if (runs.length === 0) {
          runs.push(
            new TextRun({
              text: line,
            })
          );
        }

        // No need to handle remaining text here as it's already handled in the new approach

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
    <div className="relative">
      <button
        className="group flex items-center gap-2 p-2 rounded-md bg-primary-light dark:bg-primary-dark text-white hover:bg-primary-hover dark:hover:bg-primary-dark-hover transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
        onClick={handleDownloadDocx}
        disabled={isGenerating}
        title="Download as DOCX"
      >
        <DocxIcon className="w-5 h-5 flex-shrink-0" />
        <span className="w-0 group-hover:w-auto overflow-hidden whitespace-nowrap transition-all duration-300 group-hover:ml-1">Download DOCX</span>
        {isGenerating && (
          <span className="ml-1 h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
        )}
      </button>
      {error && <div className="mt-2 text-sm text-red-500 dark:text-red-400">{error}</div>}
    </div>
  );
}

export default DocxDownloadButton;
