import {
  HeadingIcon,
  BoldIcon,
  ItalicIcon,
  StrikethroughIcon,
  CodeIcon,
  LinkIcon,
  ImageIcon,
  ListIcon,
  BlockquoteIcon,
  PageBreakIcon
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
    { id: 'codeblock', icon: <CodeIcon />, title: 'Code Block' },
    { id: 'divider3', type: 'divider' },
    { id: 'link', icon: <LinkIcon />, title: 'Link' },
    { id: 'image', icon: <ImageIcon />, title: 'Image' },
    { id: 'pageBreak', icon: <PageBreakIcon />, title: 'Page Break' },
    { id: 'divider4', type: 'divider' },
    { id: 'unorderedList', icon: <ListIcon ordered={false} />, title: 'Unordered List' },
    { id: 'orderedList', icon: <ListIcon ordered={true} />, title: 'Ordered List' },
    { id: 'blockquote', icon: <BlockquoteIcon />, title: 'Blockquote' },
  ];

  return (
    <div className="flex items-center gap-1 bg-gradient-to-r from-primary-light/5 to-accent-light/5 dark:from-primary-dark/10 dark:to-accent-dark/10 rounded-lg p-1 overflow-visible shadow-sm border border-border-light/50 dark:border-border-dark/50">
      {tools.map((tool) => (
        tool.type === 'divider' ? (
          <span key={tool.id} className="w-px h-6 bg-gradient-to-b from-primary-light/20 to-accent-light/20 dark:from-primary-dark/20 dark:to-accent-dark/20 mx-1 flex-shrink-0 rounded-full"></span>
        ) : (
          <button
            key={tool.id}
            className="flex items-center justify-center w-8 h-8 text-xs font-medium text-text-secondary dark:text-text-dark-secondary bg-transparent hover:bg-primary-light/10 dark:hover:bg-primary-dark/20 hover:text-accent-light dark:hover:text-accent-dark rounded-md transition-all duration-200 flex-shrink-0 transform hover:scale-110 btn-animated"
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
