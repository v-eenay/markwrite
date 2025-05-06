import React, { useRef, useEffect } from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-markdown';
import 'prismjs/themes/prism-tomorrow.css';
import './MarkdownCodeEditor.css';

const MarkdownCodeEditor = ({ value, onChange }) => {
  const lastValueRef = useRef(value);
  const timeoutRef = useRef(null);

  // Debounced onChange handler to make updates smoother
  const handleCodeChange = (code) => {
    // Clear any pending updates
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Update with a small delay to prevent flickering
    timeoutRef.current = setTimeout(() => {
      lastValueRef.current = code;
      onChange(code);
    }, 50);
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
    if (value !== lastValueRef.current) {
      lastValueRef.current = value;
    }
  }, [value]);

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