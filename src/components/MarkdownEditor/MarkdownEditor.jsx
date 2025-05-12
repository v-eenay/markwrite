import { useRef } from 'react';
import './MarkdownEditor.css';

function MarkdownEditor({ value, onChange }) {
  const textareaRef = useRef(null);

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
      </div>
    </div>
  );
}

export default MarkdownEditor;
