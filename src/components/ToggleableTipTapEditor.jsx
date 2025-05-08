import React, { useState, useRef, useCallback, useEffect } from 'react';
import TipTapEditor from './TipTapEditor';
import CodeEditor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-markdown';
import 'prismjs/themes/prism-tomorrow.css';
import './ToggleableTipTapEditor.css';

/**
 * ToggleableTipTapEditor - A component that allows switching between rich text and markdown modes
 *
 * @param {Object} props - Component props
 * @param {string} props.markdown - The markdown content
 * @param {Function} props.onChange - Callback function when content changes
 */
const ToggleableTipTapEditor = ({ markdown = '', onChange }) => {
  // State for tracking the current editor mode
  const [isRichTextMode, setIsRichTextMode] = useState(true);

  // Shared state
  const lastContentRef = useRef(markdown);
  const updateSourceRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const isInternalUpdateRef = useRef(false);

  // Handle changes from the Markdown Code Editor
  const handleCodeEditorChange = useCallback((code) => {
    // Skip if this is an internal update
    if (isInternalUpdateRef.current) return;

    // Clear any pending updates
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Update with a debounced delay (300ms)
    debounceTimerRef.current = setTimeout(() => {
      updateSourceRef.current = 'code';
      lastContentRef.current = code;
      onChange(code);
    }, 300);
  }, [onChange]);

  // Handle changes from the Rich Text Editor
  const handleRichTextChange = useCallback((content) => {
    // Skip if this is an internal update
    if (isInternalUpdateRef.current) return;

    // Update with the content
    updateSourceRef.current = 'rich';
    lastContentRef.current = content;
    onChange(content);
  }, [onChange]);

  // Toggle between rich text and markdown modes
  const toggleEditorMode = () => {
    setIsRichTextMode(!isRichTextMode);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="toggleable-tiptap-editor">
      {/* Toggle Switch */}
      <div className="editor-mode-toggle">
        <div className="toggle-label">
          <span className={!isRichTextMode ? 'active' : ''}>Markdown Mode</span>
        </div>

        <label className="switch">
          <input
            type="checkbox"
            checked={isRichTextMode}
            onChange={toggleEditorMode}
          />
          <span className="slider round"></span>
        </label>

        <div className="toggle-label">
          <span className={isRichTextMode ? 'active' : ''}>Rich Text Mode</span>
        </div>
      </div>

      {/* Editor Container */}
      <div className="editor-container">
        {isRichTextMode ? (
          <div className="rich-editor-wrapper">
            {/* Rich Text Editor */}
            <TipTapEditor
              markdown={markdown}
              onChange={handleRichTextChange}
              updateSource={updateSourceRef.current}
            />
          </div>
        ) : (
          <div className="code-editor-wrapper">
            {/* Markdown Code Editor */}
            <CodeEditor
              value={markdown}
              onValueChange={handleCodeEditorChange}
              highlight={(code) => highlight(code, languages.markdown)}
              padding={16}
              className="code-editor"
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 14,
                lineHeight: 1.6,
                minHeight: 450,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ToggleableTipTapEditor;
