import { useState } from 'react';
import Split from 'react-split';
import MarkdownEditor from './components/MarkdownEditor/MarkdownEditor';
import Preview from './components/Preview/Preview';
import Toolbar from './components/Toolbar/Toolbar';
import './App.css';

const DEFAULT_MARKDOWN = `# Welcome to MarkWrite

A minimalist Markdown editor with real-time preview.

## Features

- **Clean Interface**: Focus on your content
- **Split View**: Edit and preview side by side
- **Syntax Highlighting**: For both Markdown and code blocks
- **Real-time Preview**: See changes instantly

## Basic Markdown Guide

### Headers

# H1
## H2
### H3

### Emphasis

*italic* or _italic_
**bold** or __bold__
~~strikethrough~~

### Lists

- Unordered list item
- Another item
  - Nested item

1. Ordered list item
2. Another item

### Code

Inline \`code\` with backticks

\`\`\`javascript
// Code block
function hello() {
  console.log('Hello, world!');
}
\`\`\`

### Links and Images

[Link text](https://github.com/v-eenay/markwrite.git)

![Alt text](https://via.placeholder.com/150)

### Blockquotes

> This is a blockquote
> It can span multiple lines

### Tables

| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |

Start writing your own content now!
`;

function App() {
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);

  const handleMarkdownChange = (newMarkdown) => {
    setMarkdown(newMarkdown);
  };

  const handleToolbarAction = (action) => {
    let updatedMarkdown = markdown;
    const textarea = document.querySelector('.markdown-editor textarea');
    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const selectedText = markdown.substring(selectionStart, selectionEnd);
    const beforeSelection = markdown.substring(0, selectionStart);
    const afterSelection = markdown.substring(selectionEnd);

    switch (action) {
      case 'heading1':
        updatedMarkdown = beforeSelection + '# ' + selectedText + afterSelection;
        break;
      case 'heading2':
        updatedMarkdown = beforeSelection + '## ' + selectedText + afterSelection;
        break;
      case 'heading3':
        updatedMarkdown = beforeSelection + '### ' + selectedText + afterSelection;
        break;
      case 'bold':
        updatedMarkdown = beforeSelection + '**' + selectedText + '**' + afterSelection;
        break;
      case 'italic':
        updatedMarkdown = beforeSelection + '*' + selectedText + '*' + afterSelection;
        break;
      case 'strikethrough':
        updatedMarkdown = beforeSelection + '~~' + selectedText + '~~' + afterSelection;
        break;
      case 'code':
        updatedMarkdown = beforeSelection + '`' + selectedText + '`' + afterSelection;
        break;
      case 'codeblock':
        updatedMarkdown = beforeSelection + '```\n' + selectedText + '\n```' + afterSelection;
        break;
      case 'link':
        updatedMarkdown = beforeSelection + '[' + (selectedText || 'Link text') + '](url)' + afterSelection;
        break;
      case 'image':
        updatedMarkdown = beforeSelection + '![' + (selectedText || 'Alt text') + '](image-url)' + afterSelection;
        break;
      case 'unorderedList':
        updatedMarkdown = beforeSelection + '- ' + selectedText + afterSelection;
        break;
      case 'orderedList':
        updatedMarkdown = beforeSelection + '1. ' + selectedText + afterSelection;
        break;
      case 'blockquote':
        updatedMarkdown = beforeSelection + '> ' + selectedText + afterSelection;
        break;
      default:
        break;
    }

    setMarkdown(updatedMarkdown);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>MarkWrite</h1>
        <Toolbar onAction={handleToolbarAction} />
      </header>
      <main className="app-content">
        <Split 
          className="split-pane"
          sizes={[50, 50]} 
          minSize={100} 
          gutterSize={10}
          snapOffset={30}
        >
          <div className="editor-pane">
            <MarkdownEditor 
              value={markdown} 
              onChange={handleMarkdownChange} 
            />
          </div>
          <div className="preview-pane">
            <Preview markdown={markdown} />
          </div>
        </Split>
      </main>
      <footer className="app-footer">
        <p>
          MarkWrite - A minimalist Markdown editor | 
          <a href="https://github.com/v-eenay/markwrite.git" target="_blank" rel="noopener noreferrer">GitHub</a>
        </p>
      </footer>
    </div>
  );
}

export default App;
