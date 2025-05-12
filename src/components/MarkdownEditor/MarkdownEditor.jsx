import { useEffect, useRef } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import './MarkdownEditor.css';

function MarkdownEditor({ value, onChange }) {
  const textareaRef = useRef(null);
  const previewRef = useRef(null);

  // Function to synchronize scrolling between textarea and preview
  const syncScroll = (source, target) => {
    target.scrollTop = source.scrollTop;
    target.scrollLeft = source.scrollLeft;
  };

  useEffect(() => {
    // Apply syntax highlighting to the preview
    if (previewRef.current) {
      // Create a hidden element to process code blocks with highlight.js
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = value
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        // Highlight code blocks with ```
        .replace(
          /```(\w*)([\s\S]*?)```/g,
          (match, lang, code) => {
            if (lang && hljs.getLanguage(lang)) {
              return `<pre><code class="language-${lang}">${hljs.highlight(code.trim(), { language: lang }).value}</code></pre>`;
            }
            return `<pre><code>${hljs.highlightAuto(code.trim()).value}</code></pre>`;
          }
        )
        // Highlight inline code with `
        .replace(
          /`([^`]+)`/g,
          (match, code) => `<code>${code}</code>`
        );

      previewRef.current.innerHTML = tempDiv.innerHTML;
    }
  }, [value]);

  // Set up scroll synchronization
  useEffect(() => {
    const textarea = textareaRef.current;
    const preview = previewRef.current;

    if (!textarea || !preview) return;

    const handleTextareaScroll = () => syncScroll(textarea, preview);
    const handlePreviewScroll = () => syncScroll(preview, textarea);

    textarea.addEventListener('scroll', handleTextareaScroll);
    preview.addEventListener('scroll', handlePreviewScroll);

    return () => {
      textarea.removeEventListener('scroll', handleTextareaScroll);
      preview.removeEventListener('scroll', handlePreviewScroll);
    };
  }, []);

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
