import React, { useRef, useEffect, useState, useCallback } from 'react';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-markdown';
import 'prismjs/themes/prism-tomorrow.css';
import './EnhancedMarkdownEditor.css';

/**
 * EnhancedMarkdownEditor - A component for editing raw markdown with improved cursor handling
 *
 * @param {Object} props - Component props
 * @param {string} props.markdown - The markdown content
 * @param {Function} props.onValueChange - Callback function when content changes
 */
const EnhancedMarkdownEditor = ({ markdown, onValueChange }) => {
  const editorRef = useRef(null);
  const [content, setContent] = useState(markdown);
  const [cursorPosition, setCursorPosition] = useState(0);
  const lastValueRef = useRef(markdown);
  const timeoutRef = useRef(null);
  const isInternalUpdateRef = useRef(false);

  // Initialize content when component mounts or markdown changes
  useEffect(() => {
    if (markdown !== lastValueRef.current) {
      isInternalUpdateRef.current = true;
      setContent(markdown);
      lastValueRef.current = markdown;
      
      // Reset the internal update flag after a short delay
      setTimeout(() => {
        isInternalUpdateRef.current = false;
      }, 10);
    }
  }, [markdown]);

  // Handle content changes with proper cursor positioning
  const handleContentChange = useCallback((e) => {
    const newContent = e.target.value;
    const newCursorPosition = e.target.selectionStart;
    
    setContent(newContent);
    setCursorPosition(newCursorPosition);
    
    // Skip if this is an internal update
    if (isInternalUpdateRef.current) return;

    // Clear any pending updates
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Update with a small delay to prevent flickering but maintain responsiveness
    timeoutRef.current = setTimeout(() => {
      lastValueRef.current = newContent;
      onValueChange(newContent);
    }, 100);
  }, [onValueChange]);

  // Restore cursor position after content updates
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.selectionStart = cursorPosition;
      editorRef.current.selectionEnd = cursorPosition;
    }
  }, [content, cursorPosition]);

  // Handle key events for special keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    // Handle tab key to insert spaces instead of changing focus
    if (e.key === 'Tab') {
      e.preventDefault();
      
      const textarea = editorRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      // Insert 2 spaces at cursor position
      const newContent = 
        content.substring(0, start) + 
        '  ' + 
        content.substring(end);
      
      setContent(newContent);
      
      // Set cursor position after the inserted spaces
      setTimeout(() => {
        textarea.selectionStart = start + 2;
        textarea.selectionEnd = start + 2;
        setCursorPosition(start + 2);
      }, 0);
      
      // Trigger the change handler
      if (!isInternalUpdateRef.current) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          lastValueRef.current = newContent;
          onValueChange(newContent);
        }, 100);
      }
    }
  }, [content, onValueChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Render highlighted code
  const highlightedCode = highlight(content, languages.markdown, 'markdown');

  return (
    <div className="enhanced-markdown-editor">
      <div className="editor-header">
        <div className="editor-controls">
          <span className="control-dot red"></span>
          <span className="control-dot yellow"></span>
          <span className="control-dot green"></span>
        </div>
        <div className="editor-title">markdown.md</div>
      </div>
      
      <div className="editor-container">
        <textarea
          ref={editorRef}
          value={content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          className="editor-textarea"
          spellCheck="false"
        />
        
        <pre className="editor-highlighting">
          <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
        </pre>
      </div>
    </div>
  );
};

export default EnhancedMarkdownEditor;
