import { useState, useEffect, useRef } from 'react';
import Split from 'react-split';
import CodeMirrorEditor from './components/CodeMirrorEditor/CodeMirrorEditor';
import Preview from './components/Preview/Preview';
import Toolbar from './components/Toolbar/Toolbar';
import PdfDownloadButton from './components/PdfDownloadButton/PdfDownloadButton';
import './App.css';

const DEFAULT_MARKDOWN = `# Welcome to MarkWrite

A minimalist Markdown editor with real-time preview.

## Features

- **Clean Interface**: Focus on your content
- **Split View**: Edit and preview side by side
- **Syntax Highlighting**: For both Markdown and code blocks
- **Real-time Preview**: See changes instantly

## Basic Markdown Guide

### Headers

# H1
## H2
### H3

### Emphasis

*italic* or _italic_
**bold** or __bold__
~~strikethrough~~

### Lists

- Unordered list item
- Another item
  - Nested item

1. Ordered list item
2. Another item

### Code

Inline \`code\` with backticks

\`\`\`javascript
// Code block
function hello() {
  console.log('Hello, world!');
}
\`\`\`

### Links and Images

[Link text](https://github.com/v-eenay/markwrite.git)

![Alt text](/placeholder.svg)

### Blockquotes

> This is a blockquote
> It can span multiple lines

### Tables

| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |

Start writing your own content now!
`;

function App() {
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const editorRef = useRef(null);
  const previewRef = useRef(null);

  const handleMarkdownChange = (newMarkdown) => {
    setMarkdown(newMarkdown);
  };

  // Function to synchronize scrolling between editor and preview
  const syncScroll = (source, target) => {
    if (!source || !target) return;

    // Calculate relative scroll position
    const sourceScrollHeight = source.scrollHeight - source.clientHeight;
    const targetScrollHeight = target.scrollHeight - target.clientHeight;

    if (sourceScrollHeight <= 0 || targetScrollHeight <= 0) return;

    // Calculate the scroll percentage
    const scrollPercentage = source.scrollTop / sourceScrollHeight;

    // Apply the same percentage to the target with a small delay to prevent scroll loops
    // and ensure smooth scrolling
    requestAnimationFrame(() => {
      // Check if the target is still in the DOM
      if (target.isConnected) {
        target.scrollTop = scrollPercentage * targetScrollHeight;
      }
    });
  };

  // Set up scroll synchronization
  useEffect(() => {
    // Function to find the editor scroller element
    const findEditorScroller = () => {
      return editorRef.current?.querySelector('.cm-scroller');
    };

    const previewElement = previewRef.current?.querySelector('.preview-content');
    let editorElement = findEditorScroller();

    if (!editorElement || !previewElement) {
      // If elements aren't available yet, try again after a short delay
      const retryTimeout = setTimeout(() => {
        editorElement = findEditorScroller();
        if (editorElement && previewElement) {
          setupScrollListeners(editorElement, previewElement);
        }
      }, 500);

      return () => clearTimeout(retryTimeout);
    }

    // Set up the scroll listeners
    return setupScrollListeners(editorElement, previewElement);
  }, []);

  // Helper function to set up scroll listeners
  const setupScrollListeners = (editorElement, previewElement) => {
    if (!editorElement || !previewElement) return () => {};

    // Use a flag to prevent scroll loops
    let isScrolling = false;

    const handleEditorScroll = () => {
      if (!isScrolling) {
        isScrolling = true;
        syncScroll(editorElement, previewElement);
        setTimeout(() => { isScrolling = false; }, 50);
      }
    };

    const handlePreviewScroll = () => {
      if (!isScrolling) {
        isScrolling = true;
        syncScroll(previewElement, editorElement);
        setTimeout(() => { isScrolling = false; }, 50);
      }
    };

    editorElement.addEventListener('scroll', handleEditorScroll);
    previewElement.addEventListener('scroll', handlePreviewScroll);

    // Initial sync
    syncScroll(editorElement, previewElement);

    return () => {
      editorElement.removeEventListener('scroll', handleEditorScroll);
      previewElement.removeEventListener('scroll', handlePreviewScroll);
    };
  };

  const handleToolbarAction = (action) => {
    // Get the CodeMirror editor view
    const editorElement = editorRef.current?.querySelector('.cm-editor');
    if (!editorElement) return;

    // Get the CodeMirror view instance
    const view = editorElement.CodeMirror;
    if (!view) {
      // Fallback to direct text manipulation if we can't get the CodeMirror instance
      let updatedMarkdown = markdown;

      // Try to get the current selection from the document
      const selection = window.getSelection();
      let selectedText = '';
      let beforeSelection = markdown;
      let afterSelection = '';

      if (selection && selection.rangeCount > 0) {
        selectedText = selection.toString();
        const selectionStart = markdown.indexOf(selectedText);
        if (selectionStart !== -1) {
          beforeSelection = markdown.substring(0, selectionStart);
          afterSelection = markdown.substring(selectionStart + selectedText.length);
        }
      }

      // Apply the formatting
      switch (action) {
        case 'heading1':
          updatedMarkdown = beforeSelection + '# ' + selectedText + afterSelection;
          break;
        case 'heading2':
          updatedMarkdown = beforeSelection + '## ' + selectedText + afterSelection;
          break;
        case 'heading3':
          updatedMarkdown = beforeSelection + '### ' + selectedText + afterSelection;
          break;
        case 'bold':
          updatedMarkdown = beforeSelection + '**' + selectedText + '**' + afterSelection;
          break;
        case 'italic':
          updatedMarkdown = beforeSelection + '*' + selectedText + '*' + afterSelection;
          break;
        case 'strikethrough':
          updatedMarkdown = beforeSelection + '~~' + selectedText + '~~' + afterSelection;
          break;
        case 'code':
          updatedMarkdown = beforeSelection + '`' + selectedText + '`' + afterSelection;
          break;
        case 'codeblock':
          updatedMarkdown = beforeSelection + '```\n' + selectedText + '\n```' + afterSelection;
          break;
        case 'link':
          updatedMarkdown = beforeSelection + '[' + (selectedText || 'Link text') + '](url)' + afterSelection;
          break;
        case 'image':
          updatedMarkdown = beforeSelection + '![' + (selectedText || 'Alt text') + '](image-url)' + afterSelection;
          break;
        case 'unorderedList':
          updatedMarkdown = beforeSelection + '- ' + selectedText + afterSelection;
          break;
        case 'orderedList':
          updatedMarkdown = beforeSelection + '1. ' + selectedText + afterSelection;
          break;
        case 'blockquote':
          updatedMarkdown = beforeSelection + '> ' + selectedText + afterSelection;
          break;
        default:
          break;
      }

      setMarkdown(updatedMarkdown);
      return;
    }

    // Get the current selection
    const { state } = view;
    const selection = state.selection.main;
    const selectedText = state.sliceDoc(selection.from, selection.to);

    // Prepare the text to insert based on the action
    let textToInsert = '';

    switch (action) {
      case 'heading1':
        textToInsert = '# ' + selectedText;
        break;
      case 'heading2':
        textToInsert = '## ' + selectedText;
        break;
      case 'heading3':
        textToInsert = '### ' + selectedText;
        break;
      case 'bold':
        textToInsert = '**' + selectedText + '**';
        break;
      case 'italic':
        textToInsert = '*' + selectedText + '*';
        break;
      case 'strikethrough':
        textToInsert = '~~' + selectedText + '~~';
        break;
      case 'code':
        textToInsert = '`' + selectedText + '`';
        break;
      case 'codeblock':
        textToInsert = '```\n' + selectedText + '\n```';
        break;
      case 'link':
        textToInsert = '[' + (selectedText || 'Link text') + '](url)';
        break;
      case 'image':
        textToInsert = '![' + (selectedText || 'Alt text') + '](image-url)';
        break;
      case 'unorderedList':
        textToInsert = '- ' + selectedText;
        break;
      case 'orderedList':
        textToInsert = '1. ' + selectedText;
        break;
      case 'blockquote':
        textToInsert = '> ' + selectedText;
        break;
      default:
        return;
    }

    // Replace the selection with the new text
    view.dispatch({
      changes: {
        from: selection.from,
        to: selection.to,
        insert: textToInsert
      }
    });
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>MarkWrite</h1>
        <div className="header-actions">
          <Toolbar onAction={handleToolbarAction} />
          <PdfDownloadButton previewRef={previewRef} markdown={markdown} />
        </div>
      </header>
      <main className="app-content">
        <Split
          className="split-pane"
          sizes={[50, 50]}
          minSize={100}
          gutterSize={10}
          snapOffset={30}
          dragInterval={1}
          direction="horizontal"
          cursor="col-resize"
          elementStyle={(dimension, size, gutterSize) => ({
            'flex-basis': `calc(${size}% - ${gutterSize}px)`,
          })}
          gutterStyle={() => ({
            'width': '10px',
            'cursor': 'col-resize',
            'touch-action': 'none',
          })}
        >
          <div className="editor-pane" ref={editorRef}>
            <CodeMirrorEditor
              value={markdown}
              onChange={handleMarkdownChange}
            />
          </div>
          <div className="preview-pane" ref={previewRef}>
            <Preview markdown={markdown} />
          </div>
        </Split>
      </main>
      <footer className="app-footer">
        <p>
          MarkWrite - A minimalist Markdown editor |
          <a href="https://github.com/v-eenay/markwrite.git" target="_blank" rel="noopener noreferrer">GitHub</a>
        </p>
      </footer>
    </div>
  );
}

export default App;
