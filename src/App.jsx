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
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 1024);
  const { theme, toggleTheme } = useTheme();

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024;
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

  // Enhanced scroll synchronization with improved reliability
  useEffect(() => {
    let cleanup = () => {};
    let scrolling = false;
    let scrollTimeout;
    let resizeObserver = null;
    
    const setupScrollSync = () => {
      // Get the editor scroller element - this is the element that actually scrolls in CodeMirror
      const editorScroller = editorRef.current?.querySelector('.cm-scroller');
      // Get the preview content element
      const previewContent = previewRef.current?.querySelector('.preview-content');
      
      if (!editorScroller || !previewContent) return false;
      
      // Function to sync scroll positions with debouncing and better calculation
      const syncScroll = (source, target) => {
        if (scrolling) return;
        
        scrolling = true;
        clearTimeout(scrollTimeout);
        
        // Calculate scroll heights accurately
        const sourceScrollHeight = Math.max(1, source.scrollHeight - source.clientHeight);
        const targetScrollHeight = Math.max(1, target.scrollHeight - target.clientHeight);
        
        // Calculate scroll percentage with bounds checking
        const scrollPercentage = Math.min(1, Math.max(0, source.scrollTop / sourceScrollHeight));
        
        // Use requestAnimationFrame for smoother scrolling
        requestAnimationFrame(() => {
          if (target.isConnected) {
            target.scrollTop = scrollPercentage * targetScrollHeight;
          }
          
          // Reset scrolling flag after a delay
          scrollTimeout = setTimeout(() => {
            scrolling = false;
          }, 150); // Slightly longer timeout for better debouncing
        });
      };
      
      // Event handlers for scroll events with proper binding
      const handleEditorScroll = () => syncScroll(editorScroller, previewContent);
      const handlePreviewScroll = () => syncScroll(previewContent, editorScroller);
      
      // Add event listeners with passive option for better performance
      editorScroller.addEventListener('scroll', handleEditorScroll, { passive: true });
      previewContent.addEventListener('scroll', handlePreviewScroll, { passive: true });
      
      // Create a ResizeObserver to handle content size changes
      resizeObserver = new ResizeObserver(() => {
        // When content size changes, sync the scroll positions
        if (!scrolling) {
          syncScroll(editorScroller, previewContent);
        }
      });
      
      // Observe both elements for size changes
      resizeObserver.observe(editorScroller);
      resizeObserver.observe(previewContent);
      
      // Initial sync with multiple attempts to ensure it works
      const initialSyncAttempts = [100, 300, 600, 1000];
      initialSyncAttempts.forEach(delay => {
        setTimeout(() => {
          if (!scrolling) {
            syncScroll(editorScroller, previewContent);
          }
        }, delay);
      });
      
      // Return cleanup function
      cleanup = () => {
        editorScroller.removeEventListener('scroll', handleEditorScroll);
        previewContent.removeEventListener('scroll', handlePreviewScroll);
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
      };
      
      return true;
    };
    
    // Try to set up immediately, then retry with progressive delays if needed
    if (!setupScrollSync()) {
      const retryDelays = [200, 500, 1000, 2000, 3000];
      let attemptIndex = 0;
      
      const attemptSetup = () => {
        if (setupScrollSync() || attemptIndex >= retryDelays.length) {
          return; // Success or out of retries
        }
        
        // Schedule next attempt with exponential backoff
        setTimeout(attemptSetup, retryDelays[attemptIndex++]);
      };
      
      // Start retry sequence
      setTimeout(attemptSetup, retryDelays[attemptIndex++]);
    }
    
    // Clean up event listeners when component unmounts
    return () => {
      clearTimeout(scrollTimeout);
      cleanup();
    };
  }, [markdown]); // Re-run when markdown content changes

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
      case 'pageBreak':
        textToInsert = '\n\n---pagebreak---\n\n' + selectedText;
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
      {/* Responsive header - smaller on mobile */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3 bg-background-editor dark:bg-background-dark-editor border-b border-border-light dark:border-border-dark shadow-light-sm dark:shadow-dark-sm">
        <div className="flex items-center gap-1 sm:gap-2">
          <LogoIcon width={isMobileView ? 24 : 32} height={isMobileView ? 24 : 32} className="text-primary-light dark:text-primary-dark" />
          <h1 className="text-lg sm:text-xl font-semibold text-primary-light dark:text-primary-dark m-0">MarkWrite</h1>
        </div>
        {isMobileView && (
          <button 
            className={`flex flex-col justify-around w-6 h-5 sm:w-7 sm:h-6 bg-transparent border-none cursor-pointer z-[1001] p-0 ${isMenuOpen ? 'open' : ''}`}
            onClick={toggleMenu}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            aria-controls="header-actions-nav"
          >
            {/* Improved hamburger menu with smoother transitions */}
            <span className={`block w-full h-0.5 rounded-full bg-text-secondary dark:bg-text-dark-secondary transition-all duration-300 ${isMenuOpen ? 'transform translate-y-[8px] rotate-45' : ''}`}></span>
            <span className={`block w-full h-0.5 rounded-full bg-text-secondary dark:bg-text-dark-secondary transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`block w-full h-0.5 rounded-full bg-text-secondary dark:bg-text-dark-secondary transition-all duration-300 ${isMenuOpen ? 'transform -translate-y-[8px] -rotate-45' : ''}`}></span>
          </button>
        )}
        <div id="header-actions-nav" className={`flex items-center gap-2 sm:gap-3 ${isMobileView ? 'absolute top-full left-0 right-0 flex-col items-stretch bg-background-editor dark:bg-background-dark-editor border-t border-b border-border-light dark:border-border-dark p-3 shadow-light-md dark:shadow-dark-md z-[1000]' : ''} ${isMobileView && !isMenuOpen ? 'hidden' : ''}`}>
          <Toolbar onAction={handleToolbarAction} />
          {!isMobileView && (
            <button 
              onClick={toggleTheme} 
              className="p-1.5 sm:p-2 rounded-full hover:bg-background-secondary dark:hover:bg-background-dark-secondary transition-colors duration-200"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <MoonIcon className="w-5 h-5 text-text-secondary dark:text-text-dark-secondary" /> : <SunIcon className="w-5 h-5 text-text-secondary dark:text-text-dark-secondary" />}
            </button>
          )}
          <div className={`flex ${isMobileView ? 'flex-col w-full gap-2' : 'items-center gap-2'}`}>
            <PdfDownloadButton previewRef={previewRef} markdown={markdown} />
            <DocxDownloadButton previewRef={previewRef} markdown={markdown} />
          </div>
        </div>
        {isMobileView && isMenuOpen && (
           <div className="absolute top-full left-0 right-0 flex flex-col p-3 bg-background-editor dark:bg-background-dark-editor border-t border-border-light dark:border-border-dark z-[999] shadow-light-sm dark:shadow-dark-sm mt-[1px]">
              <button 
                onClick={toggleTheme} 
                className="w-full py-2 px-3 text-center bg-background-secondary dark:bg-background-dark-secondary border border-border-light dark:border-border-dark rounded-md flex items-center justify-center gap-2"
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? (
                  <>
                    <MoonIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-sm">Switch to Dark Mode</span>
                  </>
                ) : (
                  <>
                    <SunIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-sm">Switch to Light Mode</span>
                  </>
                )}
              </button>
           </div>
        )}
      </header>
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Responsive Split - vertical on mobile, horizontal on desktop */}
        <Split
          className="flex flex-1 h-full w-full overflow-hidden scrollbar-custom"
          sizes={[50, 50]}
          minSize={100}
          gutterSize={isMobileView ? 4 : 8}
          snapOffset={30}
          dragInterval={1}
          direction={isMobileView ? "vertical" : "horizontal"}
          cursor={isMobileView ? "row-resize" : "col-resize"}
          elementStyle={(dimension, size, gutterSize) => ({
            'flex-basis': `calc(${size}% - ${gutterSize}px)`,
          })}
          gutterStyle={(dimension) => ({
            'width': dimension === 'vertical' ? '100%' : '8px',
            'height': dimension === 'horizontal' ? '100%' : '8px',
            'cursor': dimension === 'vertical' ? 'row-resize' : 'col-resize',
            'touch-action': 'none',
            'background-color': theme === 'light' ? '#dbe2ea' : '#3a3c53',
            'transition': 'background-color 0.2s ease'
          })}
        >
          <div className="flex-1 h-full overflow-auto scrollbar-custom p-2 sm:p-4 bg-background-editor dark:bg-background-dark-editor" ref={editorRef}>
            <CodeMirrorEditor
              value={markdown}
              onChange={handleMarkdownChange}
            />
          </div>
          <div className="flex-1 h-full overflow-auto scrollbar-custom p-2 sm:p-4 bg-background-editor dark:bg-background-dark-editor border-l border-border-light dark:border-border-dark" ref={previewRef}>
            <Preview markdown={markdown} />
          </div>
        </Split>
      </main>
      {/* Responsive footer - smaller on mobile */}
      <footer className="p-2 sm:p-4 bg-background-editor dark:bg-background-dark-editor border-t border-border-light dark:border-border-dark text-text-secondary dark:text-text-dark-secondary text-xs sm:text-sm">
        {isMobileView ? (
          /* Simplified footer for mobile */
          <div className="w-full flex justify-between items-center">
            <p className="text-xs">&copy; {new Date().getFullYear()} MarkWrite</p>
            <div className="flex items-center gap-3">
              <a href="https://github.com/v-eenay/markwrite" target="_blank" rel="noopener noreferrer" className="hover:text-primary-light dark:hover:text-primary-dark transition-colors" aria-label="GitHub Repository">
                <GitHubIcon className="w-4 h-4" />
              </a>
              <a href="https://linkedin.com/in/v-eenay" target="_blank" rel="noopener noreferrer" className="hover:text-primary-light dark:hover:text-primary-dark transition-colors" aria-label="LinkedIn Profile">
                <LinkedInIcon className="w-4 h-4" />
              </a>
              <a href="mailto:koiralavinay@gmail.com" className="hover:text-primary-light dark:hover:text-primary-dark transition-colors" aria-label="Email Contact">
                <EmailIcon className="w-4 h-4" />
              </a>
            </div>
          </div>
        ) : (
          /* Full footer for desktop */
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="text-center sm:text-left">
              <p className="mb-1">MarkWrite - A minimalist Markdown editor</p>
              <p className="text-xs">Built with React and Tailwind CSS</p>
            </div>
            <div className="flex items-center gap-3">
              <a href="https://github.com/v-eenay/markwrite" target="_blank" rel="noopener noreferrer" className="hover:text-primary-light dark:hover:text-primary-dark transition-colors" aria-label="GitHub Repository">
                <GitHubIcon className="w-5 h-5" />
              </a>
              <a href="https://linkedin.com/in/v-eenay" target="_blank" rel="noopener noreferrer" className="hover:text-primary-light dark:hover:text-primary-dark transition-colors" aria-label="LinkedIn Profile">
                <LinkedInIcon className="w-5 h-5" />
              </a>
              <a href="mailto:koiralavinay@gmail.com" className="hover:text-primary-light dark:hover:text-primary-dark transition-colors" aria-label="Email Contact">
                <EmailIcon className="w-5 h-5" />
              </a>
            </div>
          </div>
        )}
      </footer>
    </div>
  );
}

export default App;
