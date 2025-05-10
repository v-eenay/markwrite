import React, { useState, useRef, useEffect, memo } from 'react';
import './SimpleEditor.css';

/**
 * SimpleEditor - A lightweight rich text editor using contenteditable
 *
 * @param {Object} props - Component props
 * @param {string} props.initialContent - The HTML content to initialize the editor with
 * @param {Function} props.onChange - Callback function when content changes
 */
const SimpleEditor = memo(({ initialContent = '', onChange }) => {
  const [content, setContent] = useState(initialContent);
  const editorRef = useRef(null);
  const toolbarRef = useRef(null);
  const updateTimeoutRef = useRef(null);
  const isInternalUpdateRef = useRef(false);

  // Initialize the editor with the initial content
  useEffect(() => {
    if (editorRef.current && initialContent && !isInternalUpdateRef.current) {
      try {
        // Set the content safely
        isInternalUpdateRef.current = true;

        // Ensure proper text direction
        editorRef.current.setAttribute('dir', 'ltr');

        // Set the content
        editorRef.current.innerHTML = initialContent;

        // Force a reflow to ensure proper rendering
        void editorRef.current.offsetHeight;

        // Reset the internal update flag after a short delay
        setTimeout(() => {
          isInternalUpdateRef.current = false;
        }, 50);
      } catch (error) {
        console.error('Error initializing editor content:', error);
        isInternalUpdateRef.current = false;
      }
    }
  }, [initialContent]);

  // Handle content changes with debouncing
  const handleContentChange = () => {
    if (isInternalUpdateRef.current) return;

    // Clear any pending updates
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Ensure proper text direction is maintained
    if (editorRef.current) {
      // Ensure the dir attribute is set to ltr
      if (editorRef.current.getAttribute('dir') !== 'ltr') {
        editorRef.current.setAttribute('dir', 'ltr');
      }

      // Get the current content
      const newContent = editorRef.current.innerHTML;

      // Set the content state
      setContent(newContent);

      // Debounce the onChange callback to prevent excessive updates
      updateTimeoutRef.current = setTimeout(() => {
        if (onChange) {
          onChange(newContent);
        }
      }, 300);
    }
  };

  // Execute a document command for formatting
  const execCommand = (command, value = null) => {
    document.execCommand('styleWithCSS', false, true);
    document.execCommand(command, false, value);
    editorRef.current.focus();
    handleContentChange();
  };

  // Format handlers
  const handleBold = () => execCommand('bold');
  const handleItalic = () => execCommand('italic');
  const handleUnderline = () => execCommand('underline');
  const handleHeading = (level) => {
    if (level === 0) {
      execCommand('formatBlock', 'p');
    } else {
      execCommand('formatBlock', `h${level}`);
    }
  };
  const handleBulletList = () => execCommand('insertUnorderedList');
  const handleNumberedList = () => execCommand('insertOrderedList');
  const handleLink = () => {
    const url = prompt('Enter the URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };
  const handleBlockquote = () => execCommand('formatBlock', 'blockquote');
  const handleClearFormat = () => execCommand('removeFormat');

  // Handle text direction toggle
  const handleTextDirection = (direction) => {
    if (editorRef.current) {
      // Set the direction attribute
      editorRef.current.setAttribute('dir', direction);

      // Force focus to ensure the change takes effect
      editorRef.current.focus();

      // Trigger content change to update the state
      handleContentChange();
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="simple-editor">
      <div className="simple-editor-toolbar" ref={toolbarRef}>
        <div className="toolbar-group">
          <button
            type="button"
            onClick={() => handleHeading(1)}
            title="Heading 1"
            className="toolbar-button"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => handleHeading(2)}
            title="Heading 2"
            className="toolbar-button"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => handleHeading(3)}
            title="Heading 3"
            className="toolbar-button"
          >
            H3
          </button>
          <button
            type="button"
            onClick={() => handleHeading(0)}
            title="Paragraph"
            className="toolbar-button"
          >
            P
          </button>
        </div>

        <div className="toolbar-group">
          <button
            type="button"
            onClick={handleBold}
            title="Bold"
            className="toolbar-button"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            onClick={handleItalic}
            title="Italic"
            className="toolbar-button"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            onClick={handleUnderline}
            title="Underline"
            className="toolbar-button"
          >
            <u>U</u>
          </button>
        </div>

        <div className="toolbar-group">
          <button
            type="button"
            onClick={handleBulletList}
            title="Bullet List"
            className="toolbar-button"
          >
            • List
          </button>
          <button
            type="button"
            onClick={handleNumberedList}
            title="Numbered List"
            className="toolbar-button"
          >
            1. List
          </button>
        </div>

        <div className="toolbar-group">
          <button
            type="button"
            onClick={handleBlockquote}
            title="Blockquote"
            className="toolbar-button"
          >
            Quote
          </button>
          <button
            type="button"
            onClick={handleLink}
            title="Insert Link"
            className="toolbar-button"
          >
            Link
          </button>
          <button
            type="button"
            onClick={handleClearFormat}
            title="Clear Formatting"
            className="toolbar-button"
          >
            Clear
          </button>
        </div>

        {/* Text Direction Controls */}
        <div className="toolbar-group">
          <button
            type="button"
            onClick={() => handleTextDirection('ltr')}
            title="Left to Right Text"
            className="toolbar-button"
          >
            LTR
          </button>
          <button
            type="button"
            onClick={() => handleTextDirection('rtl')}
            title="Right to Left Text"
            className="toolbar-button"
          >
            RTL
          </button>
        </div>
      </div>

      <div
        className="simple-editor-content"
        ref={editorRef}
        contentEditable
        onInput={handleContentChange}
        onBlur={handleContentChange}
        dir="ltr" // Explicitly set left-to-right text direction
        spellCheck="true" // Enable spell checking
        data-gramm="false" // Disable Grammarly or similar extensions that might interfere
        dangerouslySetInnerHTML={{ __html: initialContent }}
      />
    </div>
  );
});

export default SimpleEditor;
