import React, { useState } from 'react';
import RichTextEditor from './RichTextEditor';
import './RichTextEditorDemo.css';

const initialContent = `<h1>Rich Text Editor</h1>
<p>This is a simple rich text editor with basic formatting capabilities.</p>
<h2>Features</h2>
<ul>
  <li><strong>Bold text</strong> formatting</li>
  <li><em>Italic text</em> formatting</li>
  <li>Heading styles (H1, H2, H3)</li>
  <li>Lists (ordered and unordered)</li>
  <li>Links and images</li>
  <li>Blockquotes</li>
</ul>
<blockquote>
  <p>This is a blockquote to demonstrate formatting</p>
</blockquote>
<p>The editor provides a clean, focused interface for content creation without unnecessary distractions.</p>`;

const RichTextEditorDemo = () => {
  const [content, setContent] = useState(initialContent);

  const handleChange = (newContent) => {
    setContent(newContent);
  };

  return (
    <div className="editor-demo-container">
      <div className="editor-demo-wrapper">
        <RichTextEditor 
          initialContent={content} 
          onChange={handleChange} 
        />
      </div>
      
      <div className="editor-demo-info">
        <h2>About This Editor</h2>
        <p>
          This rich text editor provides a clean, focused interface for content creation
          with essential formatting tools. It features a toolbar with common formatting options
          and right-click context menu for quick access to formatting.
        </p>
        <p>
          The editor is optimized for performance to prevent freezing or unresponsiveness,
          even when editing large documents.
        </p>
      </div>
    </div>
  );
};

export default RichTextEditorDemo;
