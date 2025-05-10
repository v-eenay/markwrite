import React, { useState, useRef, memo } from 'react';
import { Suspense, lazy } from 'react';
import './RichTextEditor.css';

// Lazy load the SimpleEditor component to improve initial load time
const SimpleEditor = lazy(() => import('./SimpleEditor'));

// Loading fallback component
const EditorLoadingFallback = () => (
  <div className="editor-loading-fallback">
    <div className="loading-spinner"></div>
    <p>Loading editor...</p>
  </div>
);

// Error boundary for the editor
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Editor error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="editor-error">
          <h3>Something went wrong with the editor.</h3>
          <p>Please try refreshing the page.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * RichTextEditor - A component that provides rich text editing capabilities
 * using Quill as the underlying editor
 *
 * @param {Object} props - Component props
 * @param {string} props.initialContent - The initial HTML content
 * @param {Function} props.onChange - Callback function when content changes
 */
const RichTextEditor = memo(({ initialContent = '', onChange }) => {
  const [content, setContent] = useState(initialContent);
  const updateSourceRef = useRef(null);

  // Handle changes from the Rich Text Editor
  const handleContentChange = (newContent) => {
    setContent(newContent);
    if (onChange) {
      onChange(newContent);
    }
  };

  // Handle editor errors
  const handleEditorError = (error) => {
    console.error('Editor error caught by boundary:', error);
  };

  return (
    <div className="rich-text-editor">
      <div className="editor-wrapper">
        <Suspense fallback={<EditorLoadingFallback />}>
          <ErrorBoundary onError={handleEditorError}>
            <SimpleEditor
              initialContent={initialContent}
              onChange={handleContentChange}
            />
          </ErrorBoundary>
        </Suspense>
      </div>
    </div>
  );
});

export default RichTextEditor;
