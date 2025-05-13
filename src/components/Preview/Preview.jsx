import { useEffect, useRef } from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

function Preview({ markdown }) {
  const previewRef = useRef(null);

  // Configure marked with syntax highlighting
  marked.setOptions({
    highlight: function (code, language) {
      if (language && hljs.getLanguage(language)) {
        try {
          return hljs.highlight(code, { language }).value;
        } catch (err) {}
      }
      return code;
    },
    breaks: true,
    gfm: true,
  });

  useEffect(() => {
    if (!previewRef.current) return;

    // Process page breaks before parsing markdown
    const processedMarkdown = markdown.replace(/---pagebreak---/g, '<div class="page-break"></div>');
    
    // Parse markdown to HTML
    const html = marked.parse(processedMarkdown);
    
    // Set the HTML content
    previewRef.current.innerHTML = html;
    
    // Make links open in a new tab
    const links = previewRef.current.querySelectorAll('a');
    links.forEach(link => {
      if (link.getAttribute('href') && link.hostname !== window.location.hostname) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      }
    });
    
    // Page breaks are now styled via CSS in index.css
    
    // Apply syntax highlighting to code blocks
    previewRef.current.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block);
    });
  }, [markdown]);

  return (
    <div className="h-full flex flex-col">
      <div className="py-2 px-4 bg-background-secondary dark:bg-background-dark-secondary border-b border-border-light dark:border-border-dark">
        <span className="font-medium text-text-secondary dark:text-text-dark-secondary">Preview</span>
      </div>
      <div className="flex-1 overflow-auto scrollbar-custom" id="preview-scroll-container">
        <div className="preview-content prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none p-4" ref={previewRef}></div>
      </div>
    </div>
  );
}

export default Preview;
