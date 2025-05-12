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
      // Process the markdown content for syntax highlighting
      let processedContent = value
        // Preserve line breaks and spaces exactly as they are in the textarea
        .replace(/\n/g, '<br>')
        // Escape HTML characters
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        // Highlight code blocks with ```
        .replace(
          /```(\w*)([\s\S]*?)```/g,
          (match, lang, code) => {
            const highlightedCode = lang && hljs.getLanguage(lang)
              ? hljs.highlight(code.trim(), { language: lang }).value
              : hljs.highlightAuto(code.trim()).value;

            // Replace <br> with actual line breaks inside code blocks
            return `<pre><code class="language-${lang || ''}">${highlightedCode}</code></pre>`;
          }
        )
        // Highlight inline code with `
        .replace(
          /`([^`]+)`/g,
          (match, code) => `<code>${code}</code>`
        );

      // Handle spaces to ensure they render exactly like in a textarea
      processedContent = processedContent
        .replace(/ {2}/g, ' &nbsp;')  // Replace double spaces with space + nbsp
        .replace(/\t/g, '&nbsp;&nbsp;'); // Replace tabs with two nbsp

      previewRef.current.innerHTML = processedContent;
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

  // Ensure proper alignment on initial load and window resize
  useEffect(() => {
    const textarea = textareaRef.current;
    const preview = previewRef.current;

    if (!textarea || !preview) return;

    // Function to ensure exact alignment of textarea and preview
    const ensureAlignment = () => {
      // Match computed styles exactly
      const textareaStyles = window.getComputedStyle(textarea);

      // Apply the exact same computed line height to both elements
      const lineHeight = textareaStyles.lineHeight;
      textarea.style.lineHeight = lineHeight;
      preview.style.lineHeight = lineHeight;

      // Ensure padding is exactly the same
      preview.style.padding = textareaStyles.padding;

      // Force a synchronization of scroll position
      syncScroll(textarea, preview);
    };

    // Run alignment on load
    ensureAlignment();

    // Also run alignment on window resize
    window.addEventListener('resize', ensureAlignment);

    return () => {
      window.removeEventListener('resize', ensureAlignment);
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
