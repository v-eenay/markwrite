import { useEffect, useRef } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import './MarkdownEditor.css';

function MarkdownEditor({ value, onChange }) {
  const textareaRef = useRef(null);
  const previewRef = useRef(null);

  useEffect(() => {
    // Apply syntax highlighting to the preview
    if (previewRef.current) {
      previewRef.current.innerHTML = value;
      previewRef.current.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
      });
    }
  }, [value]);

  const handleChange = (e) => {
    onChange(e.target.value);
  };

  const handleTab = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      
      // Insert tab at cursor position
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      
      // Move cursor after the inserted tab
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div className="markdown-editor">
      <div className="editor-header">
        <span>Markdown</span>
      </div>
      <div className="editor-container">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleTab}
          spellCheck="false"
          placeholder="Write your markdown here..."
        />
        <pre ref={previewRef} className="editor-syntax-highlight" aria-hidden="true"></pre>
      </div>
    </div>
  );
}

export default MarkdownEditor;
