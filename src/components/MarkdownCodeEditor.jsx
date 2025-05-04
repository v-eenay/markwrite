import React from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-markdown';
import 'prismjs/themes/prism-dark.css';

const MarkdownCodeEditor = ({ value, onChange }) => {
  const handleCodeChange = (code) => {
    onChange(code);
  };

  return (
    <div className="markdown-code-editor">
      <Editor
        value={value}
        onValueChange={handleCodeChange}
        highlight={(code) => highlight(code, languages.markdown)}
        padding={16}
        style={{
          fontFamily: '"Fira code", "Fira Mono", monospace',
          fontSize: 14,
          backgroundColor: '#2e3440',
          color: '#d8dee9',
          borderRadius: '4px',
          minHeight: '300px',
        }}
      />
    </div>
  );
};

export default MarkdownCodeEditor;