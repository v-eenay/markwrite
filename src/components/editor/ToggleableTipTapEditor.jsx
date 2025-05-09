import React, { useState, useRef, useCallback, useEffect, useMemo, memo, lazy, Suspense } from 'react';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-markdown';
import 'prismjs/themes/prism-tomorrow.css';
import EnhancedMarkdownEditor from './markdown/EnhancedMarkdownEditor';
import './ToggleableTipTapEditor.css';

// Lazy load the TipTapEditor component to improve initial load time
const TipTapEditor = lazy(() => import('./richtext/TipTapEditor'));

// Throttle function to limit function calls
const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Loading fallback component - lightweight and simple
 */
const EditorLoadingFallback = memo(() => (
  <div className="editor-loading-fallback">
    <div className="editor-loading-message">Loading editor...</div>
  </div>
));

/**
 * Toggle switch component - extracted and memoized to prevent unnecessary re-renders
 */
const ToggleSwitch = memo(({ isRichTextMode, toggleEditorMode }) => (
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
));

/**
 * Markdown code editor component - using the enhanced version for better cursor handling
 */
const MarkdownCodeEditor = memo(({ markdown, onValueChange }) => (
  <div className="code-editor-wrapper">
    <EnhancedMarkdownEditor
      markdown={markdown}
      onValueChange={onValueChange}
    />
  </div>
));

/**
 * ToggleableTipTapEditor - A component that allows switching between rich text and markdown modes
 * Optimized for performance
 *
 * @param {Object} props - Component props
 * @param {string} props.markdown - The markdown content
 * @param {Function} props.onChange - Callback function when content changes
 */
const ToggleableTipTapEditor = memo(({ markdown = '', onChange }) => {
  // State for tracking the current editor mode
  const [isRichTextMode, setIsRichTextMode] = useState(true);

  // Shared state with useRef to avoid re-renders
  const lastContentRef = useRef(markdown);
  const updateSourceRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const isInternalUpdateRef = useRef(false);

  // Handle changes from the Markdown Code Editor with increased debounce time
  const handleCodeEditorChange = useCallback((code) => {
    // Skip if this is an internal update
    if (isInternalUpdateRef.current) return;

    // Clear any pending updates
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Update with a debounced delay (500ms) - increased for better performance
    debounceTimerRef.current = setTimeout(() => {
      // Only update if content has actually changed
      if (code !== lastContentRef.current) {
        updateSourceRef.current = 'code';
        lastContentRef.current = code;
        onChange(code);
      }
    }, 500);
  }, [onChange]);

  // Handle changes from the Rich Text Editor
  const handleRichTextChange = useCallback((content) => {
    // Skip if this is an internal update
    if (isInternalUpdateRef.current) return;

    // Only update if content has actually changed
    if (content !== lastContentRef.current) {
      updateSourceRef.current = 'rich';
      lastContentRef.current = content;
      onChange(content);
    }
  }, [onChange]);

  // Toggle between rich text and markdown modes - throttled to prevent rapid toggling
  const toggleEditorMode = useCallback(throttle(() => {
    setIsRichTextMode(prev => !prev);
  }, 300), []);

  // Comprehensive cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Memoize the rich text editor component to prevent unnecessary re-renders
  const richTextEditor = useMemo(() => (
    <div className="rich-editor-wrapper">
      <Suspense fallback={<EditorLoadingFallback />}>
        <TipTapEditor
          markdown={markdown}
          onChange={handleRichTextChange}
          updateSource={updateSourceRef.current}
        />
      </Suspense>
    </div>
  ), [markdown, handleRichTextChange, updateSourceRef.current]);

  // Memoize the markdown editor to prevent unnecessary re-renders
  const markdownEditor = useMemo(() => (
    <MarkdownCodeEditor
      markdown={markdown}
      onValueChange={handleCodeEditorChange}
    />
  ), [markdown, handleCodeEditorChange]);

  return (
    <div className="toggleable-tiptap-editor">
      {/* Toggle Switch - Extracted to its own component */}
      <ToggleSwitch
        isRichTextMode={isRichTextMode}
        toggleEditorMode={toggleEditorMode}
      />

      {/* Editor Container - Only render the active editor */}
      <div className="editor-container">
        {isRichTextMode ? richTextEditor : markdownEditor}
      </div>
    </div>
  );
});

export default ToggleableTipTapEditor;
