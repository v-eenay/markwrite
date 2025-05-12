import { useEffect, useRef } from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import './Preview.css';

// Configure marked with highlight.js for code syntax highlighting
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
  breaks: true,
  gfm: true
});

function Preview({ markdown }) {
  const previewRef = useRef(null);

  useEffect(() => {
    if (previewRef.current) {
      // Convert markdown to HTML and render it
      const html = marked.parse(markdown);
      previewRef.current.innerHTML = html;
      
      // Add target="_blank" to all links
      previewRef.current.querySelectorAll('a').forEach(link => {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      });
    }
  }, [markdown]);

  return (
    <div className="markdown-preview">
      <div className="preview-header">
        <span>Preview</span>
      </div>
      <div className="preview-content" ref={previewRef}></div>
    </div>
  );
}

export default Preview;
