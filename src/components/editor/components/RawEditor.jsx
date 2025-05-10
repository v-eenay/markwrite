import React, { useRef, useEffect } from 'react';
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
 */
const RawEditor = ({ 
  content, 
  onChange, 
  cursorPosition, 
  onCursorPositionChange 
}) => {
  const editorRef = useRef(null);
  const updateTimeoutRef = useRef(null);
  const isInternalUpdateRef = useRef(false);
  
  // Set cursor position when it changes externally
  useEffect(() => {
    if (editorRef.current && cursorPosition !== undefined && !isInternalUpdateRef.current) {
      setTextareaCursorPosition(editorRef.current, cursorPosition);
    }
  }, [cursorPosition]);
  
  // Handle content changes with debouncing
  const handleChange = (e) => {
    const newContent = e.target.value;
    
    // Clear any pending updates
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Get current cursor position
    const currentPosition = getTextareaCursorPosition(editorRef.current);
    
    // Notify about cursor position change
    if (onCursorPositionChange) {
      isInternalUpdateRef.current = true;
      onCursorPositionChange(currentPosition);
      
      // Reset the flag after a short delay
      setTimeout(() => {
        isInternalUpdateRef.current = false;
      }, 0);
    }
    
    // Debounce the onChange callback to prevent excessive updates
    updateTimeoutRef.current = setTimeout(() => {
      if (onChange) {
        onChange(newContent);
      }
    }, 300);
  };
  
  // Handle cursor position changes
  const handleSelect = (e) => {
    if (isInternalUpdateRef.current) return;
    
    const currentPosition = getTextareaCursorPosition(editorRef.current);
    
    if (onCursorPositionChange) {
      onCursorPositionChange(currentPosition);
    }
  };
  
  // Handle keyboard shortcuts
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
      textarea.value = newContent;
      
      // Set cursor position after the inserted tab
      textarea.selectionStart = textarea.selectionEnd = start + 2;
      
      // Trigger change event
      handleChange({ target: textarea });
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
    <textarea
      ref={editorRef}
      className="raw-editor"
      value={content || ''}
      onChange={handleChange}
      onSelect={handleSelect}
      onKeyDown={handleKeyDown}
      spellCheck="true"
      placeholder="Type Markdown here..."
    />
  );
};

export default RawEditor;
