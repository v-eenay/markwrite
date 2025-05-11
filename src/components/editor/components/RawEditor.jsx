import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState, useCallback } from 'react';
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
  // Use a single source of truth for content
  const [internalCursorPosition, setInternalCursorPosition] = useState(cursorPosition || 0);
  const editorRef = useRef(null);
  const updateTimeoutRef = useRef(null);
  const isUpdatingRef = useRef(false);

  // Forward the ref to parent components
  useImperativeHandle(ref, () => ({
    ...editorRef.current,
    // Add methods that might be needed by parent components
    focus: () => editorRef.current?.focus(),
    getCursorPosition: () => internalCursorPosition,
    setCursorPosition: (pos) => {
      if (editorRef.current) {
        setInternalCursorPosition(pos);
        setTextareaCursorPosition(editorRef.current, pos);
      }
    }
  }));

  // Update cursor position when it changes externally
  useEffect(() => {
    if (!isUpdatingRef.current && cursorPosition !== undefined && cursorPosition !== internalCursorPosition) {
      setInternalCursorPosition(cursorPosition);

      // Only set the cursor position in the DOM if the editor has focus
      if (document.activeElement === editorRef.current) {
        setTextareaCursorPosition(editorRef.current, cursorPosition);
      }
    }
  }, [cursorPosition, internalCursorPosition]);

  // Apply cursor position after render
  useEffect(() => {
    // Only set the cursor position if the editor has focus
    if (document.activeElement === editorRef.current) {
      setTextareaCursorPosition(editorRef.current, internalCursorPosition);
    }
  });

  // Handle content changes with debouncing
  const handleChange = useCallback((e) => {
    const newContent = e.target.value;
    const newPosition = e.target.selectionStart;

    // Save the current cursor position
    setInternalCursorPosition(newPosition);

    // Clear any pending updates
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Notify about cursor position change
    if (onCursorPositionChange) {
      isUpdatingRef.current = true;
      onCursorPositionChange(newPosition);
      isUpdatingRef.current = false;
    }

    // Debounce the onChange callback to prevent excessive updates
    updateTimeoutRef.current = setTimeout(() => {
      if (onChange) {
        onChange(newContent);
      }
    }, 300);
  }, [onChange, onCursorPositionChange]);

  // Handle cursor position changes
  const handleSelect = useCallback((e) => {
    if (!isUpdatingRef.current) {
      const currentPosition = e.target.selectionStart;
      setInternalCursorPosition(currentPosition);

      if (onCursorPositionChange) {
        onCursorPositionChange(currentPosition);
      }
    }
  }, [onCursorPositionChange]);

  // Handle keyboard shortcuts and special keys
  const handleKeyDown = useCallback((e) => {
    // Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();

      const textarea = editorRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      // Insert tab at cursor position
      const newContent =
        content.substring(0, start) +
        '  ' +
        content.substring(end);

      // Calculate new cursor position
      const newPosition = start + 2;

      // Update cursor position state
      setInternalCursorPosition(newPosition);

      // Notify about the change
      if (onChange) {
        onChange(newContent);
      }

      // Focus will be maintained by React's controlled component behavior
    }

    // Enter key for new lines with list continuation
    else if (e.key === 'Enter') {
      const textarea = editorRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;

      // If we're in a list, we might need to add a list marker
      const lines = content.substring(0, start).split('\n');
      const currentLine = lines[lines.length - 1];

      // Check if the current line is a list item
      const listItemMatch = currentLine.match(/^(\s*)([-*+]|\d+\.)\s/);

      if (listItemMatch && currentLine.trim().length > listItemMatch[0].length) {
        e.preventDefault(); // Prevent default to handle it ourselves

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
        const insertText = `\n${indent}${newListMarker} `;
        const newContent =
          content.substring(0, start) +
          insertText +
          content.substring(start);

        // Calculate new cursor position
        const newPosition = start + insertText.length;

        // Update cursor position state
        setInternalCursorPosition(newPosition);

        // Notify about the change
        if (onChange) {
          onChange(newContent);
        }
      }
    }
  }, [content, onChange, setInternalCursorPosition]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Handle focus events to ensure cursor position is preserved
  const handleFocus = useCallback(() => {
    // When the editor gets focus, ensure the cursor position is correct
    if (editorRef.current) {
      setTextareaCursorPosition(editorRef.current, internalCursorPosition);
    }
  }, [internalCursorPosition]);

  // Handle paste events to ensure proper line break handling
  const handlePaste = useCallback(() => {
    // Let the default paste happen, then update cursor position
    requestAnimationFrame(() => {
      if (editorRef.current) {
        const currentPosition = editorRef.current.selectionStart;
        setInternalCursorPosition(currentPosition);

        if (onCursorPositionChange) {
          onCursorPositionChange(currentPosition);
        }
      }
    });
  }, [onCursorPositionChange]);

  return (
    <textarea
      ref={editorRef}
      className="raw-editor"
      value={content || ''}
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
