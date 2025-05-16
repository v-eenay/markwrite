import { useEffect, useRef, useState } from 'react';
import hljs from 'highlight.js';
import { useTheme } from '../../contexts/ThemeContext';
import { parseMarkdown } from '../../utils/markdownParser';
// Import both light and dark themes
import 'highlight.js/styles/github.css'; // Light theme
import './syntax-dark.css'; // We'll create this custom dark theme

function Preview({ markdown }) {
  const previewRef = useRef(null);
  const { theme } = useTheme();
  const [renderError, setRenderError] = useState(null);

  // Render markdown when content changes
  useEffect(() => {
    if (!previewRef.current) return;

    try {
      setRenderError(null);

      // Parse markdown to HTML using our simple parser
      let html;
      try {
        html = parseMarkdown(markdown || '');
      } catch (err) {
        console.error('Error parsing markdown:', err);
        setRenderError('Failed to parse markdown content');

        // Provide a fallback rendering
        html = `<div class="markdown-error">
                  <h3>Error rendering markdown</h3>
                  <p>There was an error rendering the markdown content. Please check your markdown syntax.</p>
                  <pre>${err.message}</pre>
                </div>`;
      }

      // Set the HTML content
      previewRef.current.innerHTML = html;

      // Post-processing of the rendered HTML
      try {
        // Make links open in a new tab
        const links = previewRef.current.querySelectorAll('a');
        links.forEach(link => {
          if (link.getAttribute('href') && link.hostname !== window.location.hostname) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
          }
        });

        // Apply syntax highlighting to code blocks
        previewRef.current.querySelectorAll('pre code').forEach((block) => {
          try {
            // Add language-specific classes for better styling
            const language = block.className.match(/language-(\w+)/)?.[1];
            if (language) {
              block.parentElement.classList.add(`language-${language}`);
              // Add language label
              block.parentElement.setAttribute('data-language', language);
            }

            hljs.highlightElement(block);
          } catch (err) {
            console.warn('Error highlighting code block:', err);
            // Fallback to basic styling if highlighting fails
            block.classList.add('highlight-failed');
          }
        });

        // Add a class to the preview container to indicate the current theme
        if (theme === 'dark') {
          previewRef.current.classList.add('dark-preview');
        } else {
          previewRef.current.classList.remove('dark-preview');
        }
      } catch (err) {
        console.warn('Error in post-processing:', err);
      }
    } catch (err) {
      console.error('Critical error in preview rendering:', err);
      setRenderError('Critical error in preview rendering');
      if (previewRef.current) {
        previewRef.current.innerHTML = `<div class="markdown-error">
                                          <h3>Critical Error</h3>
                                          <p>There was a critical error rendering the preview.</p>
                                          <pre>${err.message}</pre>
                                        </div>`;
      }
    }
  }, [markdown, theme]);

  return (
    <div className="h-full flex flex-col">
      <div className="py-2 px-4 bg-background-secondary dark:bg-background-dark-secondary border-b border-border-light dark:border-border-dark">
        <span className="font-medium text-text-secondary dark:text-text-dark-secondary">Preview</span>
        {renderError && (
          <span className="ml-2 text-xs text-red-500 dark:text-red-400 font-medium">
            (Error: {renderError})
          </span>
        )}
      </div>
      <div className="flex-1 overflow-auto scrollbar-custom" id="preview-scroll-container">
        <div className="preview-content prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none p-4" ref={previewRef}>
          {/* Content will be set via innerHTML in the useEffect */}
        </div>
        <style jsx="true">{`
          /* Markdown element styling */
          .md-heading {
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            font-weight: 600;
            line-height: 1.25;
            color: #2f3e46;
          }

          .dark .md-heading {
            color: #e0f2f1;
          }

          .md-heading-1 {
            font-size: 2em;
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
            padding-bottom: 0.3em;
          }

          .dark .md-heading-1 {
            border-bottom-color: rgba(255, 255, 255, 0.1);
          }

          .md-heading-2 {
            font-size: 1.5em;
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
            padding-bottom: 0.3em;
          }

          .dark .md-heading-2 {
            border-bottom-color: rgba(255, 255, 255, 0.1);
          }

          .md-heading-3 {
            font-size: 1.25em;
          }

          .md-heading-4 {
            font-size: 1em;
          }

          .md-heading-5 {
            font-size: 0.875em;
          }

          .md-heading-6 {
            font-size: 0.85em;
            color: #57606a;
          }

          .dark .md-heading-6 {
            color: #a0aec0;
          }

          .md-paragraph {
            margin-top: 0;
            margin-bottom: 1em;
            line-height: 1.6;
          }

          .md-list {
            margin-top: 0;
            margin-bottom: 1em;
            padding-left: 2em;
          }

          .md-list-item {
            margin-bottom: 0.25em;
          }

          .md-blockquote {
            margin: 1em 0;
            padding: 0.5em 1em;
            border-left: 4px solid #ddd;
            color: #666;
            background-color: rgba(0, 0, 0, 0.03);
          }

          .dark .md-blockquote {
            border-left-color: #444;
            color: #bbb;
            background-color: rgba(255, 255, 255, 0.03);
          }

          .md-pre {
            margin: 1em 0;
            padding: 1em;
            overflow: auto;
            border-radius: 0.3em;
            background-color: #f6f8fa;
            border: 1px solid #e1e4e8;
          }

          .dark .md-pre {
            background-color: #1e1e2f;
            border-color: #3a3c53;
          }

          .md-code {
            display: block;
            padding: 0;
            overflow-x: auto;
            line-height: 1.5;
            font-family: 'Courier New', Courier, monospace;
            font-size: 0.9em;
            color: #333;
            background-color: transparent;
            border: none;
          }

          .dark .md-code {
            color: #e0f2f1;
          }

          .md-inline-code {
            display: inline-block;
            position: relative;
            vertical-align: baseline;
            line-height: normal;
            font-family: 'Courier New', Courier, monospace;
            font-size: 0.9em;
            color: #f72585;
            background-color: rgba(247, 37, 133, 0.08);
            border-radius: 4px;
            border: 1px solid rgba(247, 37, 133, 0.15);
            padding: 0.1em 0.4em;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          }

          .dark .md-inline-code {
            color: #ff6b6b;
            background-color: rgba(255, 107, 107, 0.1);
            border: 1px solid rgba(255, 107, 107, 0.2);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
          }

          .md-table {
            border-collapse: collapse;
            width: 100%;
            margin: 1em 0;
            overflow-x: auto;
            display: block;
          }

          .md-th, .md-td {
            border: 1px solid #ddd;
            padding: 0.5em;
            text-align: left;
          }

          .dark .md-th, .dark .md-td {
            border-color: #444;
          }

          .md-th {
            background-color: rgba(0, 0, 0, 0.05);
            font-weight: 600;
          }

          .dark .md-th {
            background-color: rgba(255, 255, 255, 0.05);
          }

          .md-strikethrough {
            text-decoration: line-through;
            color: #666;
          }

          .dark .md-strikethrough {
            color: #999;
          }

          .md-link {
            color: #0366d6;
            text-decoration: underline;
            transition: color 0.2s ease;
          }

          .md-link:hover {
            color: #0056b3;
            text-decoration: underline;
          }

          .dark .md-link {
            color: #58a6ff;
          }

          .dark .md-link:hover {
            color: #79b8ff;
          }

          .md-image {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 1em auto;
            border-radius: 4px;
          }

          .md-em {
            font-style: italic;
          }

          .md-strong {
            font-weight: 600;
            color: #24292e;
          }

          .dark .md-strong {
            color: #e0f2f1;
          }

          .md-hr {
            border: 0;
            border-top: 1px solid #eaecef;
            margin: 1.5em 0;
            height: 1px;
          }

          .dark .md-hr {
            border-top-color: #3a3c53;
          }

          /* Language label for code blocks */
          pre[data-language]::before {
            content: attr(data-language);
            display: block;
            font-size: 0.7em;
            color: #999;
            margin-bottom: 0.5em;
            text-transform: uppercase;
          }

          /* Error and fallback styling */
          .markdown-error {
            padding: 1rem;
            margin: 1rem 0;
            border-radius: 0.5rem;
            background-color: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #ef4444;
          }

          .dark .markdown-error {
            background-color: rgba(248, 113, 113, 0.1);
            border-color: rgba(248, 113, 113, 0.3);
            color: #f87171;
          }

          .markdown-error h3 {
            margin-top: 0;
            color: #ef4444;
          }

          .dark .markdown-error h3 {
            color: #f87171;
          }

          .markdown-error pre {
            background-color: rgba(239, 68, 68, 0.05);
            padding: 0.5rem;
            border-radius: 0.25rem;
            overflow-x: auto;
            font-family: monospace;
            font-size: 0.875rem;
            margin-top: 0.5rem;
          }

          .highlight-failed {
            background-color: #f1f5f9;
            color: #334155;
            padding: 1rem;
            border-radius: 0.25rem;
            border: 1px solid #cbd5e1;
          }

          .dark .highlight-failed {
            background-color: #1e293b;
            color: #e2e8f0;
            border-color: #475569;
          }

          .markdown-fallback {
            padding: 1rem;
            margin: 1rem 0;
            border-radius: 0.5rem;
            background-color: rgba(59, 130, 246, 0.1);
            border: 1px solid rgba(59, 130, 246, 0.3);
            color: #3b82f6;
          }

          .dark .markdown-fallback {
            background-color: rgba(96, 165, 250, 0.1);
            border-color: rgba(96, 165, 250, 0.3);
            color: #60a5fa;
          }

          .markdown-fallback p {
            margin-top: 0;
            color: #3b82f6;
            font-weight: 500;
          }

          .dark .markdown-fallback p {
            color: #60a5fa;
          }

          .markdown-fallback pre {
            background-color: rgba(59, 130, 246, 0.05);
            padding: 0.5rem;
            border-radius: 0.25rem;
            overflow-x: auto;
            font-family: monospace;
            font-size: 0.875rem;
            margin-top: 0.5rem;
            white-space: pre-wrap;
            word-break: break-word;
            color: #334155;
          }

          .dark .markdown-fallback pre {
            background-color: rgba(96, 165, 250, 0.05);
            color: #e2e8f0;
          }

          /* Page break styling */
          .page-break {
            page-break-after: always;
            break-after: page;
            height: 1px;
            background-color: #ddd;
            margin: 2em 0;
          }

          .dark .page-break {
            background-color: #444;
          }
        `}</style>
      </div>
    </div>
  );
}

export default Preview;
