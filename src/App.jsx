import { useState } from 'react'
import MilkdownEditor from './components/MilkdownEditor'
import MainLayout from './components/MainLayout'
import ExportToolbar from './components/ExportToolbar'
import MarkdownCodeEditor from './components/MarkdownCodeEditor'
import './App.css'
import './styles/MilkdownEditor.css'
import './styles/milkdown-styles.css'
import 'prismjs/themes/prism-tomorrow.css'

function App() {
  const [markdown, setMarkdown] = useState(`# MarkWrite

A powerful Markdown editor built with React and Milkdown.

## Features

- GitHub Flavored Markdown support
- Dark theme (Nord)
- Real-time preview
- Export to PDF and DOCX (coming soon)

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

  const handleMarkdownChange = (newMarkdown) => {
    setMarkdown(newMarkdown);
  };

  return (
    <MainLayout>
      <ExportToolbar markdown={markdown} />
      
      <div className="editor-container">
        <div className="editor-section">
          <h2>Editor</h2>
          <MilkdownEditor 
            markdown={markdown} 
            onChange={handleMarkdownChange} 
          />
        </div>

        <div className="preview-section">
          <h2>Raw Markdown</h2>
          <MarkdownCodeEditor 
            value={markdown} 
            onChange={handleMarkdownChange} 
          />
        </div>
      </div>
    </MainLayout>
  )
}

export default App
