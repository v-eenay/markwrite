import { useEffect, useRef } from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';
import { useTheme } from '../../contexts/ThemeContext';
// Import both light and dark themes
import 'highlight.js/styles/github.css'; // Light theme
import './syntax-dark.css'; // We'll create this custom dark theme

function Preview({ markdown }) {
  const previewRef = useRef(null);
  const { theme } = useTheme();

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
    headerIds: true,
    mangle: false,
    sanitize: false, // Allow HTML in the markdown
    smartLists: true,
    smartypants: true,
  });

  // Add custom renderers for strikethrough text and inline code
  const renderer = new marked.Renderer();

  // Custom renderer for strikethrough text
  renderer.del = function(text) {
    // Ensure text is a string to prevent [object Object] issues
    const safeText = typeof text === 'object' ?
      (text.toString() === '[object Object]' ? JSON.stringify(text) : text.toString()) :
      String(text);

    // Clean up any potential [object Object] prefix
    const cleanText = safeText.replace(/^\[object Object\]/, '');

    return '<del class="pdf-strikethrough">' + cleanText + '</del>';
  };

  // Custom renderer for inline code
  renderer.codespan = function(code) {
    // Ensure code is a string to prevent [object Object] issues
    const safeCode = typeof code === 'object' ?
      (code.toString() === '[object Object]' ? JSON.stringify(code) : code.toString()) :
      String(code);

    // Clean up any potential [object Object] prefix
    const cleanCode = safeCode.replace(/^\[object Object\]/, '');

    return '<code class="pdf-inline-code">' + cleanCode + '</code>';
  };

  marked.use({ renderer });

  useEffect(() => {
    if (!previewRef.current) return;

    // Process page breaks before parsing markdown
    // Use a more specific replacement that ensures the page break is properly rendered
    const processedMarkdown = markdown.replace(/---pagebreak---/g, '\n\n<div class="page-break"></div>\n\n');

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
      // Add language-specific classes for better styling
      const language = block.className.match(/language-(\w+)/)?.[1];
      if (language) {
        block.parentElement.classList.add(`language-${language}`);
      }

      hljs.highlightElement(block);
    });

    // Add a class to the preview container to indicate the current theme
    // This helps with applying the correct syntax highlighting theme
    if (theme === 'dark') {
      previewRef.current.classList.add('dark-preview');
    } else {
      previewRef.current.classList.remove('dark-preview');
    }
  }, [markdown, theme]);

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
