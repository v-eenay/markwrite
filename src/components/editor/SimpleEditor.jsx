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

  // Initialize the editor with the initial content - only on first render
  useEffect(() => {
    if (editorRef.current && initialContent) {
      try {
        // Set the content safely - only on first render
        isInternalUpdateRef.current = true;

        // Ensure proper text direction
        editorRef.current.setAttribute('dir', 'ltr');

        // Set the content only if it's different
        if (editorRef.current.innerHTML !== initialContent) {
          editorRef.current.innerHTML = initialContent;
        }

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
  }, []); // Empty dependency array - only run on mount

  // Handle updates to initialContent prop after initial render
  useEffect(() => {
    if (!editorRef.current || isInternalUpdateRef.current) return;

    // Only update if content is different and editor doesn't have focus
    if (initialContent !== content && document.activeElement !== editorRef.current) {
      try {
        isInternalUpdateRef.current = true;

        // Set content without disrupting cursor if possible
        editorRef.current.innerHTML = initialContent;
        setContent(initialContent);

        // Reset the flag
        setTimeout(() => {
          isInternalUpdateRef.current = false;
        }, 50);
      } catch (error) {
        console.error('Error updating editor content:', error);
        isInternalUpdateRef.current = false;
      }
    }
  }, [initialContent, content]);

  // Handle content changes with debouncing
  const handleContentChange = () => {
    if (isInternalUpdateRef.current) return;

    // Clear any pending updates
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Ensure proper text direction is maintained
    if (editorRef.current) {
      // Ensure the dir attribute is set to ltr without disrupting cursor
      if (editorRef.current.getAttribute('dir') !== 'ltr') {
        // Save selection
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const savedRange = {
          startContainer: range.startContainer,
          startOffset: range.startOffset,
          endContainer: range.endContainer,
          endOffset: range.endOffset
        };

        // Set direction
        editorRef.current.setAttribute('dir', 'ltr');

        // Restore selection
        try {
          const newRange = document.createRange();
          newRange.setStart(savedRange.startContainer, savedRange.startOffset);
          newRange.setEnd(savedRange.endContainer, savedRange.endOffset);
          selection.removeAllRanges();
          selection.addRange(newRange);
        } catch (e) {
          console.error('Error restoring selection:', e);
        }
      }

      // Get the current content without modifying the DOM
      const newContent = editorRef.current.innerHTML;

      // Update state without affecting the DOM
      if (newContent !== content) {
        // Set the content state without re-rendering the contentEditable
        setContent(newContent);

        // Debounce the onChange callback to prevent excessive updates
        updateTimeoutRef.current = setTimeout(() => {
          if (onChange) {
            onChange(newContent);
          }
        }, 300);
      }
    }
  };

  // Execute a document command for formatting with cursor preservation
  const execCommand = (command, value = null) => {
    // Save selection state
    const selection = window.getSelection();
    let savedRange = null;

    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      savedRange = {
        startContainer: range.startContainer,
        startOffset: range.startOffset,
        endContainer: range.endContainer,
        endOffset: range.endOffset
      };
    }

    // Execute the command
    document.execCommand('styleWithCSS', false, true);
    document.execCommand(command, false, value);

    // Ensure focus is on the editor
    editorRef.current.focus();

    // Restore selection if needed
    if (savedRange && ['formatBlock', 'insertUnorderedList', 'insertOrderedList'].includes(command)) {
      try {
        // For commands that might significantly change the DOM structure,
        // we need to be careful about restoring selection
        setTimeout(() => {
          try {
            // Try to find the closest valid selection point
            const newRange = document.createRange();

            // Find valid nodes to select
            let startNode = savedRange.startContainer;
            let endNode = savedRange.endContainer;

            // If nodes are no longer in the document, find alternatives
            if (!document.contains(startNode)) {
              startNode = editorRef.current.firstChild || editorRef.current;
            }

            if (!document.contains(endNode)) {
              endNode = editorRef.current.lastChild || editorRef.current;
            }

            // Set the range to something valid
            newRange.setStart(startNode, Math.min(savedRange.startOffset, startNode.textContent?.length || 0));
            newRange.setEnd(endNode, Math.min(savedRange.endOffset, endNode.textContent?.length || 0));

            selection.removeAllRanges();
            selection.addRange(newRange);
          } catch (e) {
            console.error('Error restoring selection after command:', e);
          }
        }, 0);
      } catch (e) {
        console.error('Error in delayed selection restoration:', e);
      }
    }

    // Update content state without modifying DOM
    setContent(editorRef.current.innerHTML);
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

  // Handle text direction toggle with cursor preservation
  const handleTextDirection = (direction) => {
    if (editorRef.current) {
      // Save current selection
      const selection = window.getSelection();
      let savedRange = null;

      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        savedRange = {
          startContainer: range.startContainer,
          startOffset: range.startOffset,
          endContainer: range.endContainer,
          endOffset: range.endOffset
        };
      }

      // Set the direction attribute
      editorRef.current.setAttribute('dir', direction);

      // Restore selection if we had one
      if (savedRange) {
        try {
          const newRange = document.createRange();
          newRange.setStart(savedRange.startContainer, savedRange.startOffset);
          newRange.setEnd(savedRange.endContainer, savedRange.endOffset);
          selection.removeAllRanges();
          selection.addRange(newRange);
        } catch (e) {
          console.error('Error restoring selection after direction change:', e);
        }
      }

      // Force focus to ensure the change takes effect
      editorRef.current.focus();

      // Update state without modifying DOM
      setContent(editorRef.current.innerHTML);
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
        contentEditable="true"
        suppressContentEditableWarning={true}
        onInput={handleContentChange}
        onBlur={handleContentChange}
        onClick={() => editorRef.current.focus()} // Ensure clicking anywhere focuses the editor
        dir="ltr" // Explicitly set left-to-right text direction
        spellCheck="true" // Enable spell checking
        data-gramm="false" // Disable Grammarly or similar extensions that might interfere
        // Don't use dangerouslySetInnerHTML here as it can cause cursor issues
        // Initial content is set in the useEffect
      />
    </div>
  );
});

export default SimpleEditor;
