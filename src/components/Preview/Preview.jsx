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

  // Configure marked with syntax highlighting and proper token handling
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
    walkTokens: function(token) {
      // Ensure tokens have proper text representation
      if (token.type === 'del') {
        // Make sure strikethrough tokens have proper text
        if (typeof token.text === 'object') {
          token.text = token.raw.replace(/^~~|~~$/g, '');
        }
      }
      if (token.type === 'codespan') {
        // Make sure code tokens have proper text
        if (typeof token.text === 'object') {
          token.text = token.raw.replace(/^`|`$/g, '');
        }
      }
    }
  });

  // Add custom renderers for strikethrough text and inline code
  const renderer = new marked.Renderer();

  // Custom renderer for strikethrough text
  renderer.del = function(text) {
    // Handle token objects (the root cause of the issue)
    if (typeof text === 'object' && text !== null) {
      // If it's a token object with text property, use that
      if (text.text) {
        return '<del class="pdf-strikethrough">' + text.text + '</del>';
      }
      // If it's a token object with raw property, use that
      if (text.raw) {
        return '<del class="pdf-strikethrough">' + text.raw + '</del>';
      }
      // If it has a tokens array, extract text from tokens
      if (Array.isArray(text.tokens)) {
        const extractedText = text.tokens.map(token => {
          return token.text || token.raw || '';
        }).join('');
        return '<del class="pdf-strikethrough">' + extractedText + '</del>';
      }
      // Last resort: try to stringify but avoid [object Object]
      try {
        const jsonString = JSON.stringify(text);
        if (jsonString !== '[object Object]' && !jsonString.includes('"type":')) {
          return '<del class="pdf-strikethrough">' + jsonString.replace(/"/g, '') + '</del>';
        }
      } catch (e) {
        // If JSON stringify fails, fall back to simple string
      }
      // If all else fails, use a simple string representation
      return '<del class="pdf-strikethrough">' + String(text).replace(/\[object Object\]/g, '') + '</del>';
    }

    // Normal string handling
    return '<del class="pdf-strikethrough">' + text + '</del>';
  };

  // Custom renderer for inline code
  renderer.codespan = function(code) {
    // Handle token objects (the root cause of the issue)
    if (typeof code === 'object' && code !== null) {
      // If it's a token object with text property, use that
      if (code.text) {
        return '<code class="pdf-inline-code">' + code.text + '</code>';
      }
      // If it's a token object with raw property, use that
      if (code.raw) {
        return '<code class="pdf-inline-code">' + code.raw + '</code>';
      }
      // If it has a tokens array, extract text from tokens
      if (Array.isArray(code.tokens)) {
        const extractedText = code.tokens.map(token => {
          return token.text || token.raw || '';
        }).join('');
        return '<code class="pdf-inline-code">' + extractedText + '</code>';
      }
      // Last resort: try to stringify but avoid [object Object]
      try {
        const jsonString = JSON.stringify(code);
        if (jsonString !== '[object Object]' && !jsonString.includes('"type":')) {
          return '<code class="pdf-inline-code">' + jsonString.replace(/"/g, '') + '</code>';
        }
      } catch (e) {
        // If JSON stringify fails, fall back to simple string
      }
      // If all else fails, use a simple string representation
      return '<code class="pdf-inline-code">' + String(code).replace(/\[object Object\]/g, '') + '</code>';
    }

    // Normal string handling
    return '<code class="pdf-inline-code">' + code + '</code>';
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
