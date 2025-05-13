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
import { MoonIcon, SunIcon } from './components/icons/ThemeIcons';

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

    // Updated selector to match the Tailwind class we're using now
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
    <div className="flex flex-col h-screen overflow-hidden bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark">
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-background-editor dark:bg-background-dark-editor border-b border-border-light dark:border-border-dark shadow-light-sm dark:shadow-dark-sm">
        <div className="flex items-center gap-2">
          <LogoIcon width={32} height={32} className="text-primary-light dark:text-primary-dark" />
          <h1 className="text-xl font-semibold text-primary-light dark:text-primary-dark m-0">MarkWrite</h1>
        </div>
        {isMobileView && (
          <button 
            className={`flex flex-col justify-around w-7 h-6 bg-transparent border-none cursor-pointer z-[1001] p-0 ${isMenuOpen ? 'open' : ''}`}
            onClick={toggleMenu}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            aria-controls="header-actions-nav"
          >
            <span className={`block w-full h-0.5 rounded-sm bg-text-light dark:bg-text-dark transition-all duration-300 ${isMenuOpen ? 'transform translate-y-[10px] rotate-45' : ''}`}></span>
            <span className={`block w-full h-0.5 rounded-sm bg-text-light dark:bg-text-dark transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`block w-full h-0.5 rounded-sm bg-text-light dark:bg-text-dark transition-all duration-300 ${isMenuOpen ? 'transform -translate-y-[10px] -rotate-45' : ''}`}></span>
          </button>
        )}
        <div id="header-actions-nav" className={`flex items-center gap-3 ${isMobileView ? 'absolute top-full left-0 right-0 flex-col items-stretch bg-background-editor dark:bg-background-dark-editor border-t border-b border-border-light dark:border-border-dark p-4 shadow-light-md dark:shadow-dark-md z-[1000]' : ''} ${isMobileView && !isMenuOpen ? 'hidden' : ''}`}>
          <Toolbar onAction={handleToolbarAction} />
          {!isMobileView && (
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-full hover:bg-background-secondary dark:hover:bg-background-dark-secondary transition-colors duration-200"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <MoonIcon className="w-5 h-5 text-text-secondary dark:text-text-dark-secondary" /> : <SunIcon className="w-5 h-5 text-text-secondary dark:text-text-dark-secondary" />}
            </button>
          )}
          <div className={`flex ${isMobileView ? 'flex-col w-full gap-3' : 'items-center gap-2'}`}>
            <PdfDownloadButton previewRef={previewRef} markdown={markdown} />
            <DocxDownloadButton previewRef={previewRef} markdown={markdown} />
          </div>
        </div>
        {isMobileView && isMenuOpen && (
           <div className="absolute top-full left-0 right-0 flex flex-col p-4 bg-background-editor dark:bg-background-dark-editor border-t border-border-light dark:border-border-dark z-[999] shadow-light-sm dark:shadow-dark-sm mt-[1px]">
              <button 
                onClick={toggleTheme} 
                className="w-full py-3 px-4 text-center bg-background-secondary dark:bg-background-dark-secondary border border-border-light dark:border-border-dark rounded-md flex items-center justify-center gap-2"
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? (
                  <>
                    <MoonIcon className="w-5 h-5" />
                    <span>Switch to Dark Mode</span>
                  </>
                ) : (
                  <>
                    <SunIcon className="w-5 h-5" />
                    <span>Switch to Light Mode</span>
                  </>
                )}
              </button>
           </div>
        )}
      </header>
      <main className="flex-1 overflow-hidden flex flex-col">
        <Split
          className="flex flex-1 h-full w-full overflow-hidden"
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
            'background-color': 'var(--border-color)',
            'transition': 'background-color 0.2s ease'
          })}
        >
          <div className="flex-1 h-full overflow-auto p-4 bg-background-editor dark:bg-background-dark-editor" ref={editorRef}>
            <CodeMirrorEditor
              value={markdown}
              onChange={handleMarkdownChange}
            />
          </div>
          <div className="flex-1 h-full overflow-auto p-4 bg-background-editor dark:bg-background-dark-editor border-l border-border-light dark:border-border-dark" ref={previewRef}>
            <Preview markdown={markdown} />
          </div>
        </Split>
      </main>
      <footer className="py-6 px-6 bg-background-editor dark:bg-background-dark-editor border-t border-border-light dark:border-border-dark text-sm text-text-secondary dark:text-text-dark-secondary">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Logo and description */}
            <div className="md:col-span-4 flex flex-col items-center md:items-start">
              <div className="flex items-center gap-3 mb-3">
                <LogoIcon width={24} height={24} className="text-primary-light dark:text-primary-dark" />
                <h2 className="text-lg font-semibold text-text-light dark:text-text-dark m-0">MarkWrite</h2>
              </div>
              <p className="text-sm text-text-muted dark:text-text-dark-muted mb-4 text-center md:text-left">A minimalist Markdown editor with real-time preview</p>
            </div>
            
            {/* Contact info */}
            <div className="md:col-span-4 flex flex-col items-center md:items-start">
              <h3 className="text-base font-medium text-text-light dark:text-text-dark mb-3">Binay Koirala</h3>
              <div className="flex flex-col items-center md:items-start gap-2">
                <a href="mailto:koiralavinay@gmail.com" className="inline-flex items-center gap-2 text-primary-light dark:text-primary-dark hover:text-primary-hover dark:hover:text-primary-dark-hover transition-colors duration-200 no-underline text-sm" title="Personal Email">
                  <EmailIcon className="w-5 h-5" />
                  <span>koiralavinay@gmail.com</span>
                </a>
                <a href="mailto:binaya.koirala@iic.edu.np" className="inline-flex items-center gap-2 text-primary-light dark:text-primary-dark hover:text-primary-hover dark:hover:text-primary-dark-hover transition-colors duration-200 no-underline text-sm" title="Professional Email">
                  <EmailIcon className="w-5 h-5" />
                  <span>binaya.koirala@iic.edu.np</span>
                </a>
              </div>
            </div>
            
            {/* Social links */}
            <div className="md:col-span-4 flex flex-col items-center md:items-start">
              <h3 className="text-base font-medium text-text-light dark:text-text-dark mb-3">Connect</h3>
              <div className="flex gap-5">
                <a href="https://github.com/v-eenay" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary-light dark:text-primary-dark hover:text-primary-hover dark:hover:text-primary-dark-hover transition-colors duration-200 no-underline text-sm" title="GitHub Profile">
                  <GitHubIcon className="w-5 h-5" />
                  <span>v-eenay</span>
                </a>
                <a href="https://linkedin.com/in/veenay" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary-light dark:text-primary-dark hover:text-primary-hover dark:hover:text-primary-dark-hover transition-colors duration-200 no-underline text-sm" title="LinkedIn Profile">
                  <LinkedInIcon className="w-5 h-5" />
                  <span>veenay</span>
                </a>
              </div>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="mt-8 pt-4 border-t border-border-light dark:border-border-dark text-center">
            <p className="text-xs text-text-muted dark:text-text-dark-muted">&copy; {new Date().getFullYear()} MarkWrite. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
