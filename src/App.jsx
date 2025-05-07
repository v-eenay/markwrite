import { useState, useCallback } from 'react'
import ToggleableEditor from './components/ToggleableEditor'
import './App.css'
import 'prismjs/themes/prism-tomorrow.css'

function App() {
  const [markdown, setMarkdown] = useState(`# MarkWrite

A powerful Markdown editor with toggle between Rich Text and Markdown modes.

## Features

- Toggle between Rich Text and Markdown modes
- GitHub Flavored Markdown support
- Dark theme (Nord)
- Real-time synchronization
- Syntax highlighting in Markdown mode

\`\`\`js
// Example code block
function helloWorld() {
  console.log("Hello, world!");
}
\`\`\`

> This is a blockquote example.

| Table | Example |
|-------|--------|
| Row 1 | Data 1 |
| Row 2 | Data 2 |
`);

  // Handle markdown changes
  const handleMarkdownChange = useCallback((newMarkdown) => {
    setMarkdown(newMarkdown);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>MarkWrite</h1>
        <p>A toggleable Markdown editor</p>
      </header>

      <main className="app-main">
        <ToggleableEditor
          markdown={markdown}
          onChange={handleMarkdownChange}
        />
      </main>

      <footer className="app-footer">
        <p>Built with React and Milkdown</p>
      </footer>
    </div>
  );
}

export default App;
