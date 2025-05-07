import React, { useState } from 'react';
import ToggleableEditor from './ToggleableEditor';
import './MilkdownReactEditor.css';
import './MilkdownReactEditorDemo.css';

const MilkdownReactEditorDemo = () => {
  const [markdown, setMarkdown] = useState(`# Toggleable Editor Demo

This is a demo of the Toggleable Editor component.

## Features

- Toggle between Rich Text and Markdown modes
- GitHub Flavored Markdown support
- Nord dark theme
- Real-time preview
- Slash commands
- Syntax highlighting in Markdown mode

### Code Example

\`\`\`javascript
function helloWorld() {
  console.log("Hello, world!");
}
\`\`\`

### Lists

- Item 1
- Item 2
  - Nested item 1
  - Nested item 2
- Item 3

### Task Lists

- [x] Completed task
- [ ] Incomplete task

### Tables

| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |

> This is a blockquote.
`);

  const handleMarkdownChange = (newMarkdown) => {
    setMarkdown(newMarkdown);
    console.log('Markdown updated:', newMarkdown);
  };

  return (
    <div className="milkdown-react-demo">
      <h1>Toggleable Editor Demo</h1>
      <div className="editor-container">
        <div className="editor-section">
          <h2>Editor</h2>
          <ToggleableEditor
            markdown={markdown}
            onChange={handleMarkdownChange}
          />
        </div>
        <div className="preview-section">
          <h2>Preview</h2>
          <pre className="markdown-preview">{markdown}</pre>
        </div>
      </div>
    </div>
  );
};

export default MilkdownReactEditorDemo;
