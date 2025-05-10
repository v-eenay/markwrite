import React, { useState, useEffect, useRef, memo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './QuillEditor.css';

/**
 * QuillEditor - A React component that wraps the Quill editor
 * 
 * @param {Object} props - Component props
 * @param {string} props.initialContent - The HTML content to initialize the editor with
 * @param {Function} props.onChange - Callback function when content changes
 */
const QuillEditor = memo(({ initialContent = '', onChange }) => {
  const [content, setContent] = useState(initialContent);
  const [isReady, setIsReady] = useState(false);
  const quillRef = useRef(null);
  const updateTimeoutRef = useRef(null);
  const isInternalUpdateRef = useRef(false);

  // Define the Quill modules (toolbar and other features)
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean']
    ],
    clipboard: {
      // Prevent unwanted paste formatting
      matchVisual: false
    }
  };

  // Define the formats we want to allow
  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'blockquote', 'code-block',
    'link', 'image'
  ];

  // Handle content changes with debouncing
  const handleChange = (value) => {
    if (isInternalUpdateRef.current) return;

    // Clear any pending updates
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Set the content state
    setContent(value);

    // Debounce the onChange callback to prevent excessive updates
    updateTimeoutRef.current = setTimeout(() => {
      if (onChange) {
        onChange(value);
      }
    }, 300);
  };

  // Update editor content when initialContent prop changes
  useEffect(() => {
    if (!isReady) return;

    // Skip update if it's the same as our current content
    if (initialContent === content) return;

    try {
      // Mark this as an internal update to prevent feedback loops
      isInternalUpdateRef.current = true;

      // Set the content with a small delay to avoid race conditions
      const timerId = setTimeout(() => {
        setContent(initialContent);

        // Reset the internal update flag after a short delay
        setTimeout(() => {
          isInternalUpdateRef.current = false;
        }, 50);
      }, 0);

      // Clean up the timer if the component unmounts or the effect runs again
      return () => clearTimeout(timerId);
    } catch (error) {
      console.error('Error updating editor content:', error);
      isInternalUpdateRef.current = false;
    }
  }, [initialContent, content, isReady]);

  // Set ready state when component mounts
  useEffect(() => {
    setIsReady(true);
    return () => {
      // Clear any pending timeouts
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="quill-editor-wrapper">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={content}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder="Write something..."
      />
    </div>
  );
});

export default QuillEditor;
