import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState } from 'react';
import { getTextareaCursorPosition, setTextareaCursorPosition } from '../utils/cursorUtils';
import './RawEditor.css';

/**
 * RawEditor - A simple textarea-based editor for raw Markdown
 *
 * @param {Object} props - Component props
 * @param {string} props.content - The Markdown content
 * @param {Function} props.onChange - Callback function when content changes
 * @param {number} props.cursorPosition - The cursor position to set
 * @param {Function} props.onCursorPositionChange - Callback when cursor position changes
 * @param {React.Ref} ref - Forwarded ref
 */
const RawEditor = forwardRef(({
  content,
  onChange,
  cursorPosition,
  onCursorPositionChange
}, ref) => {
  const editorRef = useRef(null);
  const updateTimeoutRef = useRef(null);
  const isInternalUpdateRef = useRef(false);
  const lastCursorPositionRef = useRef(0);
  const [localContent, setLocalContent] = useState(content || '');

  // Forward the ref to parent components
  useImperativeHandle(ref, () => editorRef.current);

  // Update local content when prop changes
  useEffect(() => {
    if (content !== localContent && !isInternalUpdateRef.current) {
      setLocalContent(content || '');

      // Preserve cursor position if editor is focused
      if (document.activeElement === editorRef.current) {
        // Use a small delay to ensure the content is updated
        setTimeout(() => {
          if (editorRef.current) {
            setTextareaCursorPosition(editorRef.current, lastCursorPositionRef.current);
          }
        }, 10);
      }
    }
  }, [content, localContent]);

  // Set cursor position when it changes externally
  useEffect(() => {
    if (editorRef.current && cursorPosition !== undefined && !isInternalUpdateRef.current) {
      // Only update if the cursor position has actually changed
      if (cursorPosition !== lastCursorPositionRef.current) {
        lastCursorPositionRef.current = cursorPosition;
        setTextareaCursorPosition(editorRef.current, cursorPosition);
      }
    }
  }, [cursorPosition]);

  // Handle content changes with debouncing
  const handleChange = (e) => {
    const newContent = e.target.value;

    // Update local content immediately to prevent cursor jumping
    setLocalContent(newContent);

    // Clear any pending updates
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Get current cursor position and save it
    const currentPosition = getTextareaCursorPosition(editorRef.current);
    lastCursorPositionRef.current = currentPosition;

    // Notify about cursor position change
    if (onCursorPositionChange) {
      isInternalUpdateRef.current = true;
      onCursorPositionChange(currentPosition);

      // Reset the flag after a short delay
      setTimeout(() => {
        isInternalUpdateRef.current = false;
      }, 10);
    }

    // Debounce the onChange callback to prevent excessive updates
    updateTimeoutRef.current = setTimeout(() => {
      if (onChange) {
        isInternalUpdateRef.current = true;
        onChange(newContent);

        // Reset the flag after the parent has processed the change
        setTimeout(() => {
          isInternalUpdateRef.current = false;
        }, 10);
      }
    }, 300);
  };

  // Handle cursor position changes
  const handleSelect = (e) => {
    if (isInternalUpdateRef.current) return;

    const currentPosition = getTextareaCursorPosition(editorRef.current);
    lastCursorPositionRef.current = currentPosition;

    if (onCursorPositionChange) {
      onCursorPositionChange(currentPosition);
    }
  };

  // Handle keyboard shortcuts and special keys
  const handleKeyDown = (e) => {
    // Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();

      const textarea = editorRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      // Insert tab at cursor position
      const newContent =
        textarea.value.substring(0, start) +
        '  ' +
        textarea.value.substring(end);

      // Update the textarea value
      setLocalContent(newContent);

      // Set cursor position after the inserted tab
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
        lastCursorPositionRef.current = start + 2;
      }, 0);

      // Trigger change event
      handleChange({ target: { value: newContent } });
    }

    // Enter key for new lines
    else if (e.key === 'Enter') {
      // Let the default behavior happen, but track the cursor position
      const textarea = editorRef.current;
      const start = textarea.selectionStart;

      // Calculate where the cursor will be after the new line
      const newPosition = start + 1; // +1 for the new line character

      // Update the cursor position reference after the event has been processed
      setTimeout(() => {
        lastCursorPositionRef.current = newPosition;

        // If we're in a list, we might need to add a list marker
        const lines = textarea.value.substring(0, start).split('\n');
        const currentLine = lines[lines.length - 1];

        // Check if the current line is a list item
        const listItemMatch = currentLine.match(/^(\s*)([-*+]|\d+\.)\s/);

        if (listItemMatch && currentLine.trim().length > listItemMatch[0].length) {
          // It's a list item with content, add a new list item
          const indent = listItemMatch[1];
          const marker = listItemMatch[2];
          const isNumbered = /^\d+\./.test(marker);

          let newListMarker;
          if (isNumbered) {
            // For numbered lists, increment the number
            const num = parseInt(marker, 10);
            newListMarker = `${num + 1}.`;
          } else {
            // For bullet lists, use the same marker
            newListMarker = marker;
          }

          // Insert the new list marker
          const insertText = `${indent}${newListMarker} `;
          const newContent =
            textarea.value.substring(0, start + 1) + // Include the new line
            insertText +
            textarea.value.substring(start + 1);

          // Update the content
          setLocalContent(newContent);

          // Update the cursor position
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + 1 + insertText.length;
            lastCursorPositionRef.current = start + 1 + insertText.length;

            // Trigger change event
            handleChange({ target: { value: newContent } });
          }, 0);

          // Prevent default to handle it ourselves
          e.preventDefault();
        }
      }, 0);
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

  // Handle focus events to ensure cursor position is preserved
  const handleFocus = () => {
    // When the editor gets focus, ensure the cursor position is correct
    if (editorRef.current) {
      setTimeout(() => {
        setTextareaCursorPosition(editorRef.current, lastCursorPositionRef.current);
      }, 0);
    }
  };

  // Handle paste events to ensure proper line break handling
  const handlePaste = (e) => {
    // Let the default paste happen, then handle the content
    setTimeout(() => {
      if (editorRef.current) {
        // Get the current cursor position
        const currentPosition = getTextareaCursorPosition(editorRef.current);
        lastCursorPositionRef.current = currentPosition;

        // Trigger change event to ensure content is properly processed
        handleChange({ target: editorRef.current });
      }
    }, 0);
  };

  return (
    <textarea
      ref={editorRef}
      className="raw-editor"
      value={localContent}
      onChange={handleChange}
      onSelect={handleSelect}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onPaste={handlePaste}
      spellCheck="true"
      placeholder="Type Markdown here..."
      // Add these attributes to improve line break handling
      wrap="soft"
      autoCorrect="off"
      autoCapitalize="off"
    />
  );
});

export default RawEditor;
