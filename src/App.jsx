import { useState, useCallback, useRef } from 'react'
import MilkdownEditor from './components/MilkdownEditor'
import MainLayout from './components/MainLayout'
import ExportToolbar from './components/ExportToolbar'
import MarkdownCodeEditor from './components/MarkdownCodeEditor'
import MilkdownReactEditorDemo from './components/MilkdownReactEditorDemo'
import ToggleableEditor from './components/ToggleableEditor'
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

  // State to toggle between different editor modes
  const [editorMode, setEditorMode] = useState('original'); // 'original', 'react', or 'toggleable'

  // Track the source of the update to prevent feedback loops
  const updateSourceRef = useRef(null);

  // Handle updates from the rich text editor
  const handleRichEditorChange = useCallback((newMarkdown) => {
    updateSourceRef.current = 'rich';
    setMarkdown(newMarkdown);
  }, []);

  // Handle updates from the code editor
  const handleCodeEditorChange = useCallback((newMarkdown) => {
    updateSourceRef.current = 'code';
    setMarkdown(newMarkdown);
  }, []);

  // Handle updates from the toggleable editor
  const handleToggleableEditorChange = useCallback((newMarkdown) => {
    setMarkdown(newMarkdown);
  }, []);

  // Switch between editor modes
  const switchEditorMode = (mode) => {
    setEditorMode(mode);
  };

  return (
    <MainLayout>
      <div className="editor-toggle">
        <button
          className={`toggle-button ${editorMode === 'original' ? 'active' : ''}`}
          onClick={() => switchEditorMode('original')}
        >
          Original Editor
        </button>
        <button
          className={`toggle-button ${editorMode === 'react' ? 'active' : ''}`}
          onClick={() => switchEditorMode('react')}
        >
          React-based Editor
        </button>
        <button
          className={`toggle-button ${editorMode === 'toggleable' ? 'active' : ''}`}
          onClick={() => switchEditorMode('toggleable')}
        >
          Toggleable Editor
        </button>
      </div>

      {editorMode === 'react' ? (
        <MilkdownReactEditorDemo />
      ) : editorMode === 'toggleable' ? (
        <>
          <ExportToolbar markdown={markdown} />
          <div className="editor-container">
            <div className="editor-section full-width">
              <h2>Toggleable Editor</h2>
              <ToggleableEditor
                markdown={markdown}
                onChange={handleToggleableEditorChange}
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <ExportToolbar markdown={markdown} />
          <div className="editor-container">
            <div className="editor-section">
              <h2>Editor</h2>
              <MilkdownEditor
                markdown={markdown}
                onChange={handleRichEditorChange}
                updateSource={updateSourceRef.current}
              />
            </div>

            <div className="preview-section">
              <h2>Raw Markdown</h2>
              <MarkdownCodeEditor
                value={markdown}
                onChange={handleCodeEditorChange}
                updateSource={updateSourceRef.current}
              />
            </div>
          </div>
        </>
      )}
    </MainLayout>
  )
}

export default App
