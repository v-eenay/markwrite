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

## Basic Markdown Guidez

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
  const previewRef = useRef(null); // This ref is still used for scroll syncing, so it should remain.

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
      // Get the preview container element (the div with scrollbar-custom class)
      const previewContainer = previewRef.current?.querySelector('.scrollbar-custom');

      if (!editorScroller || !previewContainer) return false;

      // Function to sync scroll positions - optimized for performance
      const syncScroll = (source, target) => {
        if (scrolling) return;

        scrolling = true;

        // Calculate scroll heights accurately
        const sourceScrollHeight = Math.max(1, source.scrollHeight - source.clientHeight);
        const targetScrollHeight = Math.max(1, target.scrollHeight - target.clientHeight);

        // Calculate scroll percentage with bounds checking
        const scrollPercentage = Math.min(1, Math.max(0, source.scrollTop / sourceScrollHeight));

        // Direct update for immediate response
        if (target.isConnected) {
          target.scrollTop = scrollPercentage * targetScrollHeight;
        }

        // Reset scrolling flag immediately for better responsiveness
        // Use a very short timeout to prevent scroll event loops
        scrollTimeout = setTimeout(() => {
          scrolling = false;
        }, 10);
      };

      // Event handlers for scroll events with proper binding
      const handleEditorScroll = () => syncScroll(editorScroller, previewContainer);
      const handlePreviewScroll = () => syncScroll(previewContainer, editorScroller);

      // Add event listeners with passive option for better performance
      editorScroller.addEventListener('scroll', handleEditorScroll, { passive: true });
      previewContainer.addEventListener('scroll', handlePreviewScroll, { passive: true });

      // Create a ResizeObserver to handle content size changes
      resizeObserver = new ResizeObserver(() => {
        // When content size changes, sync the scroll positions
        if (!scrolling) {
          syncScroll(editorScroller, previewContainer);
        }
      });

      // Observe both elements for size changes
      resizeObserver.observe(editorScroller);
      resizeObserver.observe(previewContainer);

      // Initial sync with multiple attempts to ensure it works
      const initialSyncAttempts = [100, 300, 600, 1000];
      initialSyncAttempts.forEach(delay => {
        setTimeout(() => {
          if (!scrolling) {
            syncScroll(editorScroller, previewContainer);
          }
        }, delay);
      });

      // Return cleanup function
      cleanup = () => {
        editorScroller.removeEventListener('scroll', handleEditorScroll);
        previewContainer.removeEventListener('scroll', handlePreviewScroll);
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
        case 'pageBreak':
          updatedMarkdown = beforeSelection + (selectedText ? selectedText + '\n\n' : '') + '---pagebreak---\n\n' + afterSelection;
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
        // Ensure proper spacing around the page break marker
        textToInsert = (selectedText ? selectedText + '\n\n' : '') + '---pagebreak---\n\n';
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
      {/* Compact, playful header with vibrant design */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-primary-light/10 to-accent-light/10 dark:from-primary-dark/20 dark:to-accent-dark/20 border-b border-border-light dark:border-border-dark shadow-md dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all duration-300 pattern-dots-light dark:pattern-dots-dark">
        <div className="flex items-center gap-2">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary-light via-accent-light to-decoration-light dark:from-primary-dark dark:via-accent-dark dark:to-decoration-dark rounded-full blur opacity-60 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative">
              <LogoIcon
                width={isMobileView ? 26 : 32}
                height={isMobileView ? 26 : 32}
                className="text-primary-light dark:text-primary-dark transform group-hover:scale-110 transition-transform duration-300 animate-float"
              />
            </div>
          </div>
          <h1 className="text-lg sm:text-xl font-bold gradient-text m-0 tracking-tight">MarkWrite</h1>
        </div>
        {isMobileView && (
          <button
            className={`flex flex-col justify-around w-7 h-6 sm:w-8 sm:h-7 bg-transparent border-none cursor-pointer z-[1001] p-0 relative btn-animated ${isMenuOpen ? 'open' : ''}`}
            onClick={toggleMenu}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            aria-controls="header-actions-nav"
          >
            {/* Playful hamburger menu with colorful transitions */}
            <span className={`block w-full h-0.5 rounded-full bg-gradient-to-r from-primary-light to-accent-light dark:from-primary-dark dark:to-accent-dark transition-all duration-300 ${isMenuOpen ? 'transform translate-y-[10px] rotate-45' : ''}`}></span>
            <span className={`block w-full h-0.5 rounded-full bg-gradient-to-r from-accent-light to-decoration-light dark:from-accent-dark dark:to-decoration-dark transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`block w-full h-0.5 rounded-full bg-gradient-to-r from-decoration-light to-primary-light dark:from-decoration-dark dark:to-primary-dark transition-all duration-300 ${isMenuOpen ? 'transform -translate-y-[10px] -rotate-45' : ''}`}></span>
          </button>
        )}
        <div id="header-actions-nav" className={`flex items-center gap-3 sm:gap-4 ${isMobileView ? 'absolute top-full left-0 right-0 flex-col items-stretch bg-gradient-to-b from-primary-light/5 to-accent-light/5 dark:from-primary-dark/10 dark:to-accent-dark/10 border-t border-b border-border-light dark:border-border-dark p-3 shadow-xl dark:shadow-[0_8px_16px_rgba(0,0,0,0.4)] z-[1000] pattern-dots-light dark:pattern-dots-dark' : ''} ${isMobileView && !isMenuOpen ? 'hidden' : ''}`}>
          <Toolbar onAction={handleToolbarAction} />
          {!isMobileView && (
            <button
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 rounded-full bg-gradient-to-r from-primary-light/20 to-accent-light/20 dark:from-primary-dark/20 dark:to-accent-dark/20 hover:from-primary-light/30 hover:to-accent-light/30 dark:hover:from-primary-dark/30 dark:hover:to-accent-dark/30 text-text-light dark:text-text-dark transition-all duration-300 hover:shadow-md transform hover:scale-105 btn-animated"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ?
                <MoonIcon className="w-5 h-5 text-accent-light" /> :
                <SunIcon className="w-5 h-5 text-decoration-light" />
              }
            </button>
          )}
          <div className={`flex ${isMobileView ? 'flex-col w-full gap-3' : 'items-center gap-2'}`}>
            <PdfDownloadButton previewRef={previewRef} markdown={markdown} />
            <DocxDownloadButton previewRef={previewRef} markdown={markdown} />
          </div>
        </div>
        {isMobileView && isMenuOpen && (
           <div className="absolute top-full left-0 right-0 flex flex-col p-3 bg-gradient-to-b from-primary-light/5 to-accent-light/5 dark:from-primary-dark/10 dark:to-accent-dark/10 border-t border-border-light dark:border-border-dark z-[999] shadow-lg dark:shadow-[0_6px_14px_rgba(0,0,0,0.35)] mt-[1px] pattern-dots-light dark:pattern-dots-dark">
              <button
                onClick={toggleTheme}
                className="w-full py-2 px-4 text-center bg-gradient-to-r from-primary-light/20 to-accent-light/20 dark:from-primary-dark/20 dark:to-accent-dark/20 backdrop-blur-sm border border-border-light dark:border-border-dark rounded-lg flex items-center justify-center gap-3 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02] btn-animated"
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? (
                  <>
                    <MoonIcon className="w-5 h-5 text-accent-light" />
                    <span className="text-sm font-medium gradient-text">Switch to Dark Mode</span>
                  </>
                ) : (
                  <>
                    <SunIcon className="w-5 h-5 text-decoration-light" />
                    <span className="text-sm font-medium gradient-text">Switch to Light Mode</span>
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
          elementStyle={(_, size, gutterSize) => ({
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
      {/* Compact, playful footer with vibrant design */}
      <footer className="py-2 px-3 sm:px-4 bg-gradient-to-r from-primary-light/10 to-accent-light/10 dark:from-primary-dark/20 dark:to-accent-dark/20 border-t border-border-light dark:border-border-dark text-text-secondary dark:text-text-dark-secondary text-xs shadow-inner pattern-dots-light dark:pattern-dots-dark">
        {isMobileView ? (
          /* Compact mobile footer with playful design */
          <div className="w-full flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <LogoIcon width={16} height={16} className="text-primary-light dark:text-primary-dark" />
                <p className="text-xs font-medium gradient-text">&copy; {new Date().getFullYear()} MarkWrite</p>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href="https://github.com/v-eenay/markwrite"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-accent-light dark:hover:text-accent-dark transition-all duration-300 transform hover:scale-110"
                  aria-label="GitHub Repository"
                >
                  <GitHubIcon className="w-4 h-4" />
                </a>
                <a
                  href="https://linkedin.com/in/v-eenay"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-accent-light dark:hover:text-accent-dark transition-all duration-300 transform hover:scale-110"
                  aria-label="LinkedIn Profile"
                >
                  <LinkedInIcon className="w-4 h-4" />
                </a>
                <a
                  href="mailto:binaya.koirala@iic.edu.np"
                  className="hover:text-accent-light dark:hover:text-accent-dark transition-all duration-300 transform hover:scale-110"
                  aria-label="Professional Email Contact"
                >
                  <EmailIcon className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* GitHub Star Call-to-Action - More compact */}
            <div className="w-full py-1.5 px-2 bg-gradient-to-r from-primary-light/5 to-accent-light/5 dark:from-primary-dark/10 dark:to-accent-dark/10 rounded-md border border-border-light dark:border-border-dark flex items-center justify-center gap-1.5 playful-card relative overflow-hidden">
              <div className="absolute inset-0 animate-shimmer"></div>
              <GitHubIcon className="w-3.5 h-3.5 text-accent-light dark:text-accent-dark" />
              <p className="text-xs">
                If you enjoy using MarkWrite, please
                <a
                  href="https://github.com/v-eenay/markwrite/stargazers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mx-1 text-accent-light dark:text-accent-dark font-medium hover:underline"
                >
                  star our project
                </a>
              </p>
            </div>

            <div className="w-full h-px bg-gradient-to-r from-primary-light/20 via-accent-light/20 to-decoration-light/20 dark:from-primary-dark/20 dark:via-accent-dark/20 dark:to-decoration-dark/20 opacity-50"></div>
            <p className="text-xs text-center text-text-muted dark:text-text-dark-muted">Designed & Developed by Binay Koirala</p>
          </div>
        ) : (
          /* Compact desktop footer with playful design */
          <div className="flex flex-col items-center gap-2">
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center gap-2">
                <LogoIcon width={18} height={18} className="text-primary-light dark:text-primary-dark" />
                <div>
                  <p className="font-medium text-xs gradient-text">MarkWrite - A minimalist Markdown editor</p>
                  <p className="text-xs text-text-muted dark:text-text-dark-muted">&copy; {new Date().getFullYear()} Binay Koirala</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <a
                    href="https://github.com/v-eenay/markwrite"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-accent-light dark:hover:text-accent-dark transition-all duration-300 transform hover:scale-110"
                    aria-label="GitHub Repository"
                  >
                    <GitHubIcon className="w-4 h-4" />
                  </a>
                  <a
                    href="https://linkedin.com/in/v-eenay"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-accent-light dark:hover:text-accent-dark transition-all duration-300 transform hover:scale-110"
                    aria-label="LinkedIn Profile"
                  >
                    <LinkedInIcon className="w-4 h-4" />
                  </a>
                  <a
                    href="mailto:binaya.koirala@iic.edu.np"
                    className="hover:text-accent-light dark:hover:text-accent-dark transition-all duration-300 transform hover:scale-110"
                    aria-label="Professional Email Contact"
                  >
                    <EmailIcon className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* GitHub Star Call-to-Action - More compact */}
            <div className="py-1.5 px-3 bg-gradient-to-r from-primary-light/5 to-accent-light/5 dark:from-primary-dark/10 dark:to-accent-dark/10 rounded-md border border-border-light dark:border-border-dark flex items-center justify-center gap-2 max-w-md playful-card relative overflow-hidden">
              <div className="absolute inset-0 animate-shimmer"></div>
              <GitHubIcon className="w-4 h-4 text-accent-light dark:text-accent-dark" />
              <p className="text-xs">
                If you enjoy using MarkWrite, please
                <a
                  href="https://github.com/v-eenay/markwrite/stargazers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mx-1 text-accent-light dark:text-accent-dark font-medium hover:underline"
                >
                  star our project
                </a>
                on GitHub!
              </p>
            </div>
          </div>
        )}
      </footer>
    </div>
  );
}

export default App;
