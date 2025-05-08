import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import MarkdownIt from 'markdown-it';
import './TipTapEditor.css';

// Initialize markdown parser and lowlight
const md = new MarkdownIt();
const lowlight = createLowlight(common);

/**
 * Context menu component for the TipTap editor
 */
const ContextMenu = ({ editor, position, onClose }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  if (!editor) return null;

  return (
    <div
      className="tiptap-context-menu"
      ref={menuRef}
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
    >
      <div className="tiptap-context-menu-items">
        <button onClick={() => { editor.chain().focus().toggleBold().run(); onClose(); }}>
          Bold
        </button>
        <button onClick={() => { editor.chain().focus().toggleItalic().run(); onClose(); }}>
          Italic
        </button>
        <button onClick={() => { editor.chain().focus().toggleStrike().run(); onClose(); }}>
          Strikethrough
        </button>
        <button onClick={() => { editor.chain().focus().toggleCode().run(); onClose(); }}>
          Code
        </button>
        <button onClick={() => {
          const url = window.prompt('URL');
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
          onClose();
        }}>
          Link
        </button>
        <div className="tiptap-context-menu-divider"></div>
        <button onClick={() => { editor.chain().focus().toggleHeading({ level: 1 }).run(); onClose(); }}>
          Heading 1
        </button>
        <button onClick={() => { editor.chain().focus().toggleHeading({ level: 2 }).run(); onClose(); }}>
          Heading 2
        </button>
        <button onClick={() => { editor.chain().focus().toggleHeading({ level: 3 }).run(); onClose(); }}>
          Heading 3
        </button>
        <div className="tiptap-context-menu-divider"></div>
        <button onClick={() => { editor.chain().focus().toggleBulletList().run(); onClose(); }}>
          Bullet List
        </button>
        <button onClick={() => { editor.chain().focus().toggleOrderedList().run(); onClose(); }}>
          Ordered List
        </button>
        <button onClick={() => { editor.chain().focus().toggleTaskList().run(); onClose(); }}>
          Task List
        </button>
        <div className="tiptap-context-menu-divider"></div>
        <button onClick={() => { editor.chain().focus().toggleBlockquote().run(); onClose(); }}>
          Blockquote
        </button>
        <button onClick={() => {
          editor.chain().focus().setCodeBlock().run();
          onClose();
        }}>
          Code Block
        </button>
      </div>
    </div>
  );
};

/**
 * TipTapEditor - A React component that wraps the TipTap editor
 *
 * @param {Object} props - Component props
 * @param {string} props.markdown - The markdown content to initialize the editor with
 * @param {Function} props.onChange - Callback function when content changes
 * @param {string} props.updateSource - Source of the update ('rich' or 'code')
 */
const TipTapEditor = ({ markdown = '', onChange, updateSource }) => {
  const [loading, setLoading] = useState(true);
  const lastContentRef = useRef(markdown);
  const updateTimeoutRef = useRef(null);
  const isInternalUpdateRef = useRef(false);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });

  // Initialize the TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Write something...',
      }),
      Link.configure({
        openOnClick: false,
      }),
      Image,
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content: markdown,
    onUpdate: ({ editor }) => {
      if (isInternalUpdateRef.current) return;

      // Clear any pending updates
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      // Update with a debounced delay (300ms)
      updateTimeoutRef.current = setTimeout(() => {
        // Convert HTML to Markdown
        const html = editor.getHTML();
        // Use a simple approach to convert HTML to Markdown
        // This is a basic conversion and might need refinement for complex content
        const content = html
          .replace(/<h1>(.*?)<\/h1>/g, '# $1\n\n')
          .replace(/<h2>(.*?)<\/h2>/g, '## $1\n\n')
          .replace(/<h3>(.*?)<\/h3>/g, '### $1\n\n')
          .replace(/<h4>(.*?)<\/h4>/g, '#### $1\n\n')
          .replace(/<h5>(.*?)<\/h5>/g, '##### $1\n\n')
          .replace(/<h6>(.*?)<\/h6>/g, '###### $1\n\n')
          .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
          .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
          .replace(/<em>(.*?)<\/em>/g, '*$1*')
          .replace(/<s>(.*?)<\/s>/g, '~~$1~~')
          .replace(/<code>(.*?)<\/code>/g, '`$1`')
          .replace(/<a href="(.*?)">(.*?)<\/a>/g, '[$2]($1)')
          .replace(/<blockquote>(.*?)<\/blockquote>/g, '> $1\n\n')
          .replace(/<pre><code>(.*?)<\/code><\/pre>/g, '```\n$1\n```\n\n')
          .replace(/<ul>(.*?)<\/ul>/g, '$1\n')
          .replace(/<ol>(.*?)<\/ol>/g, '$1\n')
          .replace(/<li>(.*?)<\/li>/g, '- $1\n')
          .replace(/<br>/g, '\n')
          .replace(/&nbsp;/g, ' ')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .trim();

        lastContentRef.current = content;
        onChange(content);
      }, 300);
    },
    onTransaction: () => {
      // This ensures the editor is always focused when a transaction happens
      editor?.commands.focus();
    },
  });

  // Set loading state when editor is ready
  useEffect(() => {
    if (editor) {
      setLoading(false);
    }
  }, [editor]);

  // Update editor content when markdown prop changes
  useEffect(() => {
    if (!editor || loading) return;

    // Skip update if it's the same as our last known content
    if (markdown === lastContentRef.current) return;

    // Only update the editor if the change came from the code editor
    if (updateSource !== 'code') return;

    try {
      // Mark this as an internal update to prevent feedback loops
      isInternalUpdateRef.current = true;

      // Update the editor content
      editor.commands.setContent(markdown);

      // Update our reference to the current content
      lastContentRef.current = markdown;

      // Reset the internal update flag after a short delay
      setTimeout(() => {
        isInternalUpdateRef.current = false;
      }, 10);
    } catch (error) {
      console.error('Error updating TipTap content:', error);
      isInternalUpdateRef.current = false;
    }
  }, [markdown, editor, loading, updateSource]);

  // Handle right-click for context menu
  const handleContextMenu = useCallback((event) => {
    if (!editor) return;

    event.preventDefault();

    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY
    });
  }, [editor]);

  // Close the context menu
  const closeContextMenu = useCallback(() => {
    setContextMenu({ ...contextMenu, visible: false });
  }, [contextMenu]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="tiptap-editor-wrapper">
      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'is-active' : ''}
          >
            Bold
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'is-active' : ''}
          >
            Italic
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive('strike') ? 'is-active' : ''}
          >
            Strike
          </button>
        </BubbleMenu>
      )}

      <div
        className="tiptap-editor"
        onContextMenu={handleContextMenu}
      >
        <EditorContent editor={editor} />
      </div>

      {loading && (
        <div className="tiptap-loading-overlay">
          <div className="tiptap-loading">Loading editor...</div>
        </div>
      )}

      {contextMenu.visible && editor && (
        <ContextMenu
          editor={editor}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
};

export default TipTapEditor;
