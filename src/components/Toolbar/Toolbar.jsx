import {
  HeadingIcon,
  BoldIcon,
  ItalicIcon,
  StrikethroughIcon,
  CodeIcon,
  CodeBlockIcon,
  LinkIcon,
  ImageIcon,
  ListIcon,
  BlockquoteIcon
} from '../icons/ToolbarIcons';

function Toolbar({ onAction }) {
  const tools = [
    { id: 'heading1', icon: <HeadingIcon level={1} />, title: 'Heading 1' },
    { id: 'heading2', icon: <HeadingIcon level={2} />, title: 'Heading 2' },
    { id: 'heading3', icon: <HeadingIcon level={3} />, title: 'Heading 3' },
    { id: 'divider1', type: 'divider' },
    { id: 'bold', icon: <BoldIcon />, title: 'Bold' },
    { id: 'italic', icon: <ItalicIcon />, title: 'Italic' },
    { id: 'strikethrough', icon: <StrikethroughIcon />, title: 'Strikethrough' },
    { id: 'divider2', type: 'divider' },
    { id: 'code', icon: <CodeIcon />, title: 'Inline Code' },
    { id: 'codeblock', icon: <CodeBlockIcon />, title: 'Code Block' },
    { id: 'divider3', type: 'divider' },
    { id: 'link', icon: <LinkIcon />, title: 'Link' },
    { id: 'image', icon: <ImageIcon />, title: 'Image' },
    { id: 'divider4', type: 'divider' },
    { id: 'unorderedList', icon: <ListIcon ordered={false} />, title: 'Unordered List' },
    { id: 'orderedList', icon: <ListIcon ordered={true} />, title: 'Ordered List' },
    { id: 'blockquote', icon: <BlockquoteIcon />, title: 'Blockquote' },
  ];

  return (
    <div className="flex items-center gap-1 bg-background-editor dark:bg-background-dark-editor rounded p-1 overflow-visible">
      {tools.map((tool) => (
        tool.type === 'divider' ? (
          <span key={tool.id} className="w-px h-6 bg-border-light dark:bg-border-dark mx-1 flex-shrink-0"></span>
        ) : (
          <button
            key={tool.id}
            className="flex items-center justify-center w-8 h-8 text-xs font-medium text-text-secondary dark:text-text-dark-secondary bg-transparent hover:bg-background-secondary dark:hover:bg-background-dark-secondary hover:text-text-light dark:hover:text-text-dark rounded transition-colors duration-200 flex-shrink-0"
            title={tool.title}
            onClick={() => onAction(tool.id)}
          >
            {tool.icon}
          </button>
        )
      ))}
    </div>
  );
}

export default Toolbar;
