import './Toolbar.css';

function Toolbar({ onAction }) {
  const tools = [
    { id: 'heading1', label: 'H1', title: 'Heading 1' },
    { id: 'heading2', label: 'H2', title: 'Heading 2' },
    { id: 'heading3', label: 'H3', title: 'Heading 3' },
    { id: 'divider1', type: 'divider' },
    { id: 'bold', label: 'B', title: 'Bold' },
    { id: 'italic', label: 'I', title: 'Italic' },
    { id: 'strikethrough', label: 'S', title: 'Strikethrough' },
    { id: 'divider2', type: 'divider' },
    { id: 'code', label: '`', title: 'Inline Code' },
    { id: 'codeblock', label: '```', title: 'Code Block' },
    { id: 'divider3', type: 'divider' },
    { id: 'link', label: '🔗', title: 'Link' },
    { id: 'image', label: '🖼️', title: 'Image' },
    { id: 'divider4', type: 'divider' },
    { id: 'unorderedList', label: '•', title: 'Unordered List' },
    { id: 'orderedList', label: '1.', title: 'Ordered List' },
    { id: 'blockquote', label: '>', title: 'Blockquote' },
  ];

  return (
    <div className="markdown-toolbar">
      {tools.map((tool) => (
        tool.type === 'divider' ? (
          <span key={tool.id} className="toolbar-divider"></span>
        ) : (
          <button
            key={tool.id}
            className="toolbar-button"
            title={tool.title}
            onClick={() => onAction(tool.id)}
          >
            {tool.label}
          </button>
        )
      ))}
    </div>
  );
}

export default Toolbar;
