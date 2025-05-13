import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from './contexts/ThemeContext';
import Split from 'react-split';
import CodeMirrorEditor from './components/CodeMirrorEditor/CodeMirrorEditor';
import Preview from './components/Preview/Preview';
import Toolbar from './components/Toolbar/Toolbar';
import PdfDownloadButton from './components/PdfDownloadButton/PdfDownloadButton';
import DocxDownloadButton from './components/DocxDownloadButton/DocxDownloadButton';
import { LogoIcon } from './components/icons/ToolbarIcons';
import GitHubIcon from './components/icons/GitHubIcon';
import LinkedInIcon from './components/icons/LinkedInIcon';
import EmailIcon from './components/icons/EmailIcon';
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

![Alt text](./placeholder.svg)

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
  const { theme, toggleTheme } = useTheme();

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobileView(mobile);
      if (!mobile) {
        setIsMenuOpen(false); // Close menu when switching to desktop view
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener('resize', handleResize);
  }, []);
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
    <div className="app" data-theme={theme}>
      <header className="app-header">
        <div className="app-logo">
          <LogoIcon width={32} height={32} />
          <h1>MarkWrite</h1>
        </div>
        {isMobileView && (
          <button 
            className={`hamburger-button ${isMenuOpen ? 'open' : ''}`}
            onClick={toggleMenu}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            aria-controls="header-actions-nav"
          >
            <span className="hamburger-icon">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        )}
        <div id="header-actions-nav" className={`header-actions ${isMobileView ? 'mobile-nav' : ''} ${isMobileView && isMenuOpen ? 'open' : ''}`}>
          <Toolbar onAction={handleToolbarAction} />
          {!isMobileView && (
            <button onClick={toggleTheme} className="theme-toggle-button" aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          )}
          <div className="download-buttons">
            <PdfDownloadButton previewRef={previewRef} markdown={markdown} />
            <DocxDownloadButton previewRef={previewRef} markdown={markdown} />
          </div>
        </div>
        {isMobileView && isMenuOpen && (
           <div className="mobile-menu-bottom-actions">
              <button onClick={toggleTheme} className="theme-toggle-button mobile-theme-toggle" aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
                {theme === 'light' ? 'Switch to Dark Mode 🌙' : 'Switch to Light Mode ☀️'}
              </button>
           </div>
        )}
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
        <div className="footer-content">
          <div className="footer-info">
            <div className="footer-branding">
              <LogoIcon width={24} height={24} />
              <h2 className="footer-title">MarkWrite</h2>
            </div>
            <p className="footer-description">A minimalist Markdown editor with real-time preview</p>
          </div>
          <div className="footer-contact-info">
            <div className="footer-personal">
              <h3 className="footer-section-title">Binay Koirala</h3>
              <div className="footer-contact">
                <a href="mailto:koiralavinay@gmail.com" className="footer-link" title="Personal Email">
                  <EmailIcon className="footer-icon" />
                  <span>koiralavinay@gmail.com</span>
                </a>
                <a href="mailto:binaya.koirala@iic.edu.np" className="footer-link" title="Professional Email">
                  <EmailIcon className="footer-icon" />
                  <span>binaya.koirala@iic.edu.np</span>
                </a>
              </div>
            </div>
            <div className="footer-social">
              <h3 className="footer-section-title">Connect</h3>
              <div className="footer-social-links">
                <a href="https://github.com/v-eenay" target="_blank" rel="noopener noreferrer" className="footer-link" title="GitHub Profile">
                  <GitHubIcon className="footer-icon" />
                  <span>v-eenay</span>
                </a>
                <a href="https://linkedin.com/in/veenay" target="_blank" rel="noopener noreferrer" className="footer-link" title="LinkedIn Profile">
                  <LinkedInIcon className="footer-icon" />
                  <span>veenay</span>
                </a>
              </div>
            </div>
          </div>
          <div className="footer-copyright">
            <p>&copy; {new Date().getFullYear()} MarkWrite. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
