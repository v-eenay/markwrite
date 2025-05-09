import React, { memo, useCallback } from 'react';
import './EditorToolbar.css';

/**
 * EditorToolbar - A component that provides formatting controls for the TipTap editor
 *
 * @param {Object} props - Component props
 * @param {Object} props.editor - The TipTap editor instance
 */
const EditorToolbar = memo(({ editor }) => {
  if (!editor) {
    return null;
  }

  // Helper function to create button click handlers
  const handleButtonClick = useCallback((action) => {
    return () => {
      action();
      editor.commands.focus();
    };
  }, [editor]);

  // Handle link insertion
  const handleLinkClick = useCallback(() => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  // Handle heading selection
  const handleHeadingClick = useCallback((level) => {
    return () => {
      editor.chain().focus().toggleHeading({ level }).run();
    };
  }, [editor]);

  return (
    <div className="editor-toolbar">
      <div className="toolbar-group">
        <button
          onClick={handleButtonClick(() => editor.chain().focus().toggleBold().run())}
          className={editor.isActive('bold') ? 'is-active' : ''}
          title="Bold"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
            <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
          </svg>
        </button>
        <button
          onClick={handleButtonClick(() => editor.chain().focus().toggleItalic().run())}
          className={editor.isActive('italic') ? 'is-active' : ''}
          title="Italic"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="4" x2="10" y2="4"></line>
            <line x1="14" y1="20" x2="5" y2="20"></line>
            <line x1="15" y1="4" x2="9" y2="20"></line>
          </svg>
        </button>
        <button
          onClick={handleButtonClick(() => editor.chain().focus().toggleStrike().run())}
          className={editor.isActive('strike') ? 'is-active' : ''}
          title="Strikethrough"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <path d="M16 6C16 6 14.5 4 12 4C9.5 4 7 6 7 8C7 10 9 11 11 11"></path>
            <path d="M13 13C15 13 17 14 17 16C17 18 14.5 20 12 20C9.5 20 8 18 8 18"></path>
          </svg>
        </button>
        <button
          onClick={handleButtonClick(() => editor.chain().focus().toggleCode().run())}
          className={editor.isActive('code') ? 'is-active' : ''}
          title="Inline Code"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
        </button>
        <button
          onClick={handleLinkClick}
          className={editor.isActive('link') ? 'is-active' : ''}
          title="Link"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
        </button>
      </div>

      <div className="toolbar-divider"></div>

      <div className="toolbar-group">
        <div className="heading-dropdown">
          <button
            className={`heading-button ${editor.isActive('heading') ? 'is-active' : ''}`}
            title="Headings"
            type="button"
            onClick={() => {
              // Toggle dropdown visibility via a class
              const dropdown = document.querySelector('.heading-dropdown');
              dropdown.classList.toggle('active');

              // Add a click outside listener to close the dropdown
              const closeDropdown = (e) => {
                if (!dropdown.contains(e.target)) {
                  dropdown.classList.remove('active');
                  document.removeEventListener('click', closeDropdown);
                }
              };

              // Add the listener with a slight delay to avoid immediate triggering
              setTimeout(() => {
                document.addEventListener('click', closeDropdown);
              }, 10);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 12h12"></path>
              <path d="M6 4h12"></path>
              <path d="M6 20h12"></path>
            </svg>
            <span>Headings</span>
            <svg className="dropdown-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          <div className="heading-dropdown-content">
            <button
              onClick={handleHeadingClick(1)}
              className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
              type="button"
            >
              Heading 1
            </button>
            <button
              onClick={handleHeadingClick(2)}
              className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
              type="button"
            >
              Heading 2
            </button>
            <button
              onClick={handleHeadingClick(3)}
              className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
              type="button"
            >
              Heading 3
            </button>
          </div>
        </div>
      </div>

      <div className="toolbar-divider"></div>

      <div className="toolbar-group">
        <button
          onClick={handleButtonClick(() => editor.chain().focus().toggleBulletList().run())}
          className={editor.isActive('bulletList') ? 'is-active' : ''}
          title="Bullet List"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="9" y1="6" x2="20" y2="6"></line>
            <line x1="9" y1="12" x2="20" y2="12"></line>
            <line x1="9" y1="18" x2="20" y2="18"></line>
            <circle cx="4" cy="6" r="2"></circle>
            <circle cx="4" cy="12" r="2"></circle>
            <circle cx="4" cy="18" r="2"></circle>
          </svg>
        </button>
        <button
          onClick={handleButtonClick(() => editor.chain().focus().toggleOrderedList().run())}
          className={editor.isActive('orderedList') ? 'is-active' : ''}
          title="Numbered List"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="10" y1="6" x2="21" y2="6"></line>
            <line x1="10" y1="12" x2="21" y2="12"></line>
            <line x1="10" y1="18" x2="21" y2="18"></line>
            <path d="M4 6h1v4"></path>
            <path d="M4 10h2"></path>
            <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path>
          </svg>
        </button>
        <button
          onClick={handleButtonClick(() => editor.chain().focus().toggleTaskList().run())}
          className={editor.isActive('taskList') ? 'is-active' : ''}
          title="Task List"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="6" height="6" rx="1"></rect>
            <path d="M3 17h6"></path>
            <path d="M13 6h8"></path>
            <path d="M13 12h8"></path>
            <path d="M13 18h8"></path>
          </svg>
        </button>
      </div>

      <div className="toolbar-divider"></div>

      <div className="toolbar-group">
        <button
          onClick={handleButtonClick(() => editor.chain().focus().toggleBlockquote().run())}
          className={editor.isActive('blockquote') ? 'is-active' : ''}
          title="Blockquote"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 11h-4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v6c0 2.667-1.333 4.333-4 5"></path>
            <path d="M19 11h-4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v6c0 2.667-1.333 4.333-4 5"></path>
          </svg>
        </button>
        <button
          onClick={handleButtonClick(() => editor.chain().focus().setCodeBlock().run())}
          className={editor.isActive('codeBlock') ? 'is-active' : ''}
          title="Code Block"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
        </button>
      </div>
    </div>
  );
});

export default EditorToolbar;
