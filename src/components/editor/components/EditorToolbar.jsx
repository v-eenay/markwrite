import React from 'react';
import './EditorToolbar.css';

/**
 * EditorToolbar - A toolbar with formatting buttons for the editor
 * 
 * @param {Object} props - Component props
 * @param {string} props.editorMode - Current editor mode ('wysiwyg' or 'markdown')
 * @param {Function} props.onFormatCommand - Callback for formatting commands
 * @param {Function} props.onModeToggle - Callback for toggling editor mode
 * @param {boolean} props.showPreview - Whether preview is shown
 * @param {Function} props.onPreviewToggle - Callback for toggling preview
 */
const EditorToolbar = ({ 
  editorMode, 
  onFormatCommand, 
  onModeToggle,
  showPreview,
  onPreviewToggle
}) => {
  // Format handlers for WYSIWYG mode
  const handleWysiwygFormat = (command, value = null) => {
    if (onFormatCommand) {
      onFormatCommand({ mode: 'wysiwyg', command, value });
    }
  };
  
  // Format handlers for Markdown mode
  const handleMarkdownFormat = (markdownSyntax, options = {}) => {
    if (onFormatCommand) {
      onFormatCommand({ 
        mode: 'markdown', 
        syntax: markdownSyntax,
        options
      });
    }
  };
  
  // Toggle editor mode
  const toggleMode = () => {
    if (onModeToggle) {
      onModeToggle(editorMode === 'wysiwyg' ? 'markdown' : 'wysiwyg');
    }
  };
  
  // Toggle preview
  const togglePreview = () => {
    if (onPreviewToggle) {
      onPreviewToggle(!showPreview);
    }
  };
  
  return (
    <div className="editor-toolbar">
      <div className="toolbar-group">
        <button 
          type="button" 
          onClick={() => editorMode === 'wysiwyg' 
            ? handleWysiwygFormat('formatBlock', 'h1') 
            : handleMarkdownFormat('# ')}
          title={`Heading 1 ${editorMode === 'markdown' ? '(# )' : ''}`}
          className="toolbar-button"
        >
          H1
        </button>
        <button 
          type="button" 
          onClick={() => editorMode === 'wysiwyg' 
            ? handleWysiwygFormat('formatBlock', 'h2') 
            : handleMarkdownFormat('## ')}
          title={`Heading 2 ${editorMode === 'markdown' ? '(## )' : ''}`}
          className="toolbar-button"
        >
          H2
        </button>
        <button 
          type="button" 
          onClick={() => editorMode === 'wysiwyg' 
            ? handleWysiwygFormat('formatBlock', 'h3') 
            : handleMarkdownFormat('### ')}
          title={`Heading 3 ${editorMode === 'markdown' ? '(### )' : ''}`}
          className="toolbar-button"
        >
          H3
        </button>
        <button 
          type="button" 
          onClick={() => editorMode === 'wysiwyg' 
            ? handleWysiwygFormat('formatBlock', 'p') 
            : handleMarkdownFormat('\n')}
          title="Paragraph"
          className="toolbar-button"
        >
          P
        </button>
      </div>

      <div className="toolbar-group">
        <button 
          type="button" 
          onClick={() => editorMode === 'wysiwyg' 
            ? handleWysiwygFormat('bold') 
            : handleMarkdownFormat('**', { wrap: true })}
          title={`Bold ${editorMode === 'markdown' ? '(**text**)' : ''}`}
          className="toolbar-button"
        >
          <strong>B</strong>
        </button>
        <button 
          type="button" 
          onClick={() => editorMode === 'wysiwyg' 
            ? handleWysiwygFormat('italic') 
            : handleMarkdownFormat('*', { wrap: true })}
          title={`Italic ${editorMode === 'markdown' ? '(*text*)' : ''}`}
          className="toolbar-button"
        >
          <em>I</em>
        </button>
        <button 
          type="button" 
          onClick={() => editorMode === 'wysiwyg' 
            ? handleWysiwygFormat('strikethrough') 
            : handleMarkdownFormat('~~', { wrap: true })}
          title={`Strikethrough ${editorMode === 'markdown' ? '(~~text~~)' : ''}`}
          className="toolbar-button"
        >
          <s>S</s>
        </button>
      </div>

      <div className="toolbar-group">
        <button 
          type="button" 
          onClick={() => editorMode === 'wysiwyg' 
            ? handleWysiwygFormat('insertUnorderedList') 
            : handleMarkdownFormat('- ', { list: true })}
          title={`Bullet List ${editorMode === 'markdown' ? '(- item)' : ''}`}
          className="toolbar-button"
        >
          • List
        </button>
        <button 
          type="button" 
          onClick={() => editorMode === 'wysiwyg' 
            ? handleWysiwygFormat('insertOrderedList') 
            : handleMarkdownFormat('1. ', { list: true })}
          title={`Numbered List ${editorMode === 'markdown' ? '(1. item)' : ''}`}
          className="toolbar-button"
        >
          1. List
        </button>
      </div>

      <div className="toolbar-group">
        <button 
          type="button" 
          onClick={() => editorMode === 'wysiwyg' 
            ? handleWysiwygFormat('formatBlock', 'blockquote') 
            : handleMarkdownFormat('> ', { block: true })}
          title={`Blockquote ${editorMode === 'markdown' ? '(> text)' : ''}`}
          className="toolbar-button"
        >
          Quote
        </button>
        <button 
          type="button" 
          onClick={() => editorMode === 'wysiwyg' 
            ? handleWysiwygFormat('createLink', prompt('Enter the URL:')) 
            : handleMarkdownFormat('[](url)', { link: true })}
          title={`Link ${editorMode === 'markdown' ? '([text](url))' : ''}`}
          className="toolbar-button"
        >
          Link
        </button>
        <button 
          type="button" 
          onClick={() => editorMode === 'wysiwyg' 
            ? handleWysiwygFormat('formatBlock', 'pre') 
            : handleMarkdownFormat('```\n\n```', { codeBlock: true })}
          title={`Code Block ${editorMode === 'markdown' ? '(```code```)' : ''}`}
          className="toolbar-button"
        >
          Code
        </button>
      </div>
      
      <div className="toolbar-group toolbar-group-right">
        <button
          type="button"
          onClick={togglePreview}
          title={showPreview ? "Hide Preview" : "Show Preview"}
          className={`toolbar-button ${showPreview ? 'active' : ''}`}
        >
          {showPreview ? "Hide Preview" : "Show Preview"}
        </button>
        <button
          type="button"
          onClick={toggleMode}
          title={`Switch to ${editorMode === 'wysiwyg' ? 'Markdown' : 'WYSIWYG'} Mode`}
          className="toolbar-button mode-toggle"
        >
          {editorMode === 'wysiwyg' ? "Markdown" : "WYSIWYG"}
        </button>
      </div>
    </div>
  );
};

export default EditorToolbar;
