import { useState, useCallback } from 'react'
import ToggleableTipTapEditor from '../components/editor/ToggleableTipTapEditor'
import './App.css'
import 'prismjs/themes/prism-tomorrow.css'

function App() {
  const [markdown, setMarkdown] = useState(`# MarkWrite

A modern, minimal Markdown editor with toggle between Rich Text and Markdown modes.

## Features

- Toggle between Rich Text and Markdown modes
- GitHub Flavored Markdown support
- Modern, minimal UI
- Real-time synchronization
- Syntax highlighting in Markdown mode

\`\`\`js
// Example code block
function helloWorld() {
  console.log("Hello, world!");
}
\`\`\`

> This is a blockquote example with a modern design.

| Feature | Description |
|---------|-------------|
| Toggle Mode | Switch between rich text and raw markdown |
| Syntax Highlighting | Code blocks with language detection |
| Real-time Preview | See changes instantly |
`);

  // Handle markdown changes
  const handleMarkdownChange = useCallback((newMarkdown) => {
    setMarkdown(newMarkdown);
  }, []);

  // Current year for copyright
  const currentYear = new Date().getFullYear();

  return (
    <div className="app">
      <header className="app-header">
        <img src="/logo.svg" alt="MarkWrite Logo" className="app-logo" />
        <div className="app-title-container">
          <h1>MarkWrite</h1>
          <p>Modern Markdown Editor</p>
        </div>
      </header>

      <main className="app-main">
        <ToggleableTipTapEditor
          markdown={markdown}
          onChange={handleMarkdownChange}
        />
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-info">
            <h3>Contact Information</h3>
            <p>
              <strong>Binay Koirala</strong>
            </p>
            <p>
              Professional: <a href="mailto:binaya.koirala@iic.edu.np">binaya.koirala@iic.edu.np</a>
            </p>
            <p>
              Personal: <a href="mailto:koiralavinay@gmail.com">koiralavinay@gmail.com</a>
            </p>
          </div>
          <div className="footer-links">
            <div className="social-links">
              <a href="https://github.com/v-eenay" target="_blank" rel="noopener noreferrer" className="social-link" title="GitHub">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                </svg>
              </a>
              <a href="https://linkedin.com/in/veenay" target="_blank" rel="noopener noreferrer" className="social-link" title="LinkedIn">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect x="2" y="9" width="4" height="12"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
              </a>
            </div>
            <div className="copyright">
              &copy; {currentYear} Binay Koirala. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
