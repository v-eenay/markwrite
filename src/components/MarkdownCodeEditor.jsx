import React, { useRef, useEffect } from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-markdown';
import 'prismjs/themes/prism-tomorrow.css';
import './MarkdownCodeEditor.css';

/**
 * MarkdownCodeEditor - A component for editing raw markdown with syntax highlighting
 *
 * @param {Object} props - Component props
 * @param {string} props.value - The markdown content
 * @param {Function} props.onChange - Callback function when content changes
 * @param {string} props.updateSource - Source of the update ('rich' or 'code')
 */
const MarkdownCodeEditor = ({ value, onChange, updateSource }) => {
  const lastValueRef = useRef(value);
  const timeoutRef = useRef(null);
  const isInternalUpdateRef = useRef(false);

  // Debounced onChange handler to make updates smoother
  const handleCodeChange = (code) => {
    // Skip if this is an internal update
    if (isInternalUpdateRef.current) return;

    // Clear any pending updates
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Update with a small delay to prevent flickering
    timeoutRef.current = setTimeout(() => {
      lastValueRef.current = code;
      onChange(code);
    }, 10); // Reduced delay for faster response
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Update local value when external value changes
  useEffect(() => {
    // Skip update if it's the same as our last known content
    if (value === lastValueRef.current) return;

    // Only update if the change came from the rich text editor
    // This prevents feedback loops and ensures smooth synchronization
    if (updateSource !== 'rich') return;

    // Mark this as an internal update
    isInternalUpdateRef.current = true;

    // Update our reference to the current content
    lastValueRef.current = value;

    // Reset the internal update flag after a short delay
    setTimeout(() => {
      isInternalUpdateRef.current = false;
    }, 10);
  }, [value, updateSource]);

  return (
    <div className="markdown-code-editor">
      <div className="code-editor-header">
        <div className="code-editor-controls">
          <span className="control-dot red"></span>
          <span className="control-dot yellow"></span>
          <span className="control-dot green"></span>
        </div>
        <div className="code-editor-title">markdown.md</div>
      </div>
      <div className="code-editor-container">
        <Editor
          value={value}
          onValueChange={handleCodeChange}
          highlight={(code) => highlight(code, languages.markdown)}
          padding={16}
          className="code-editor"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            lineHeight: 1.6,
          }}
        />
        <div className="code-editor-glow"></div>
      </div>
    </div>
  );
};

export default MarkdownCodeEditor;