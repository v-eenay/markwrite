import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import MarkdownIt from 'markdown-it';
import './TipTapEditor.css';

// Initialize markdown parser and lowlight - outside component to avoid re-creation
const md = new MarkdownIt();
const lowlight = createLowlight(common);

// Throttle function to limit function calls
const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Context menu component for the TipTap editor
 * Memoized to prevent unnecessary re-renders
 */
const ContextMenu = memo(({ editor, position, onClose }) => {
  const menuRef = useRef(null);

  // Memoize event handlers to prevent recreating them on each render
  const handleButtonClick = useCallback((action) => {
    return () => {
      action();
      onClose();
    };
  }, [onClose]);

  useEffect(() => {
    // Use a more efficient event handler
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    // Add event listener with capture phase for better performance
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [onClose]);

  if (!editor) return null;

  // Memoize menu position style to prevent object recreation on each render
  const menuStyle = useMemo(() => ({
    position: 'absolute',
    left: `${position.x}px`,
    top: `${position.y}px`
  }), [position.x, position.y]);

  // Memoize link handler
  const handleLinkClick = useCallback(() => {
    const url = window.prompt('URL');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
    onClose();
  }, [editor, onClose]);

  return (
    <div
      className="tiptap-context-menu"
      ref={menuRef}
      style={menuStyle}
    >
      <div className="tiptap-context-menu-items">
        <button onClick={handleButtonClick(() => editor.chain().focus().toggleBold().run())}>
          Bold
        </button>
        <button onClick={handleButtonClick(() => editor.chain().focus().toggleItalic().run())}>
          Italic
        </button>
        <button onClick={handleButtonClick(() => editor.chain().focus().toggleStrike().run())}>
          Strikethrough
        </button>
        <button onClick={handleButtonClick(() => editor.chain().focus().toggleCode().run())}>
          Code
        </button>
        <button onClick={handleLinkClick}>
          Link
        </button>
        <div className="tiptap-context-menu-divider"></div>
        <button onClick={handleButtonClick(() => editor.chain().focus().toggleHeading({ level: 1 }).run())}>
          Heading 1
        </button>
        <button onClick={handleButtonClick(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}>
          Heading 2
        </button>
        <button onClick={handleButtonClick(() => editor.chain().focus().toggleHeading({ level: 3 }).run())}>
          Heading 3
        </button>
        <div className="tiptap-context-menu-divider"></div>
        <button onClick={handleButtonClick(() => editor.chain().focus().toggleBulletList().run())}>
          Bullet List
        </button>
        <button onClick={handleButtonClick(() => editor.chain().focus().toggleOrderedList().run())}>
          Ordered List
        </button>
        <button onClick={handleButtonClick(() => editor.chain().focus().toggleTaskList().run())}>
          Task List
        </button>
        <div className="tiptap-context-menu-divider"></div>
        <button onClick={handleButtonClick(() => editor.chain().focus().toggleBlockquote().run())}>
          Blockquote
        </button>
        <button onClick={handleButtonClick(() => editor.chain().focus().setCodeBlock().run())}>
          Code Block
        </button>
      </div>
    </div>
  );
});

/**
 * Convert HTML to Markdown using a more efficient approach
 * This function is memoized to prevent unnecessary recalculations
 */
const convertHtmlToMarkdown = (html) => {
  // Use the markdown-it library to parse HTML
  // This is more efficient than using regex for complex HTML
  try {
    // Create a temporary div to handle HTML entities
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const decodedHtml = tempDiv.textContent || tempDiv.innerText || '';

    // Use markdown-it to render the HTML to markdown
    // This is a simplified approach - in a real implementation,
    // you might want to use a dedicated HTML-to-Markdown converter
    return md.render(decodedHtml);
  } catch (error) {
    console.error('Error converting HTML to Markdown:', error);
    return html;
  }
};

/**
 * TipTapEditor - A React component that wraps the TipTap editor
 * Optimized for performance
 *
 * @param {Object} props - Component props
 * @param {string} props.markdown - The markdown content to initialize the editor with
 * @param {Function} props.onChange - Callback function when content changes
 * @param {string} props.updateSource - Source of the update ('rich' or 'code')
 */
const TipTapEditor = memo(({ markdown = '', onChange, updateSource }) => {
  const [loading, setLoading] = useState(true);
  const lastContentRef = useRef(markdown);
  const updateTimeoutRef = useRef(null);
  const isInternalUpdateRef = useRef(false);
  const [contextMenuState, setContextMenuState] = useState({ visible: false, x: 0, y: 0 });

  // Memoize editor extensions to prevent recreation on each render
  const extensions = useMemo(() => [
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
  ], []);

  // Create a more efficient update handler with increased debounce time
  const handleUpdate = useCallback(({ editor }) => {
    if (isInternalUpdateRef.current) return;

    // Clear any pending updates
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Use a longer debounce for better performance (500ms)
    updateTimeoutRef.current = setTimeout(() => {
      try {
        // Get HTML content
        const html = editor.getHTML();

        // Use a more efficient HTML-to-Markdown conversion
        // For large documents, we'll use a worker or chunked processing in a real implementation
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

        // Only update if content has actually changed
        if (content !== lastContentRef.current) {
          lastContentRef.current = content;
          onChange(content);
        }
      } catch (error) {
        console.error('Error in editor update handler:', error);
      }
    }, 500); // Increased debounce time for better performance
  }, [onChange]);

  // Create a throttled transaction handler to prevent excessive focus calls
  const handleTransaction = useCallback(throttle(() => {
    // Only focus if the editor is already in a focused state to prevent unnecessary focus events
    if (editor && editor.isFocused) {
      editor.commands.focus();
    }
  }, 100), [editor]);

  // Initialize the TipTap editor with memoized options
  const editor = useEditor({
    extensions,
    content: markdown,
    onUpdate: handleUpdate,
    onTransaction: handleTransaction,
  });

  // Set loading state when editor is ready
  useEffect(() => {
    if (editor) {
      setLoading(false);
    }
  }, [editor]);

  // Update editor content when markdown prop changes - optimized
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
      const timerId = setTimeout(() => {
        isInternalUpdateRef.current = false;
      }, 50); // Increased from 10ms to 50ms for better stability

      // Clean up the timer if the component unmounts or the effect runs again
      return () => clearTimeout(timerId);
    } catch (error) {
      console.error('Error updating TipTap content:', error);
      isInternalUpdateRef.current = false;
    }
  }, [markdown, editor, loading, updateSource]);

  // Handle right-click for context menu - optimized with throttling
  const handleContextMenu = useCallback(throttle((event) => {
    if (!editor) return;

    event.preventDefault();

    setContextMenuState({
      visible: true,
      x: event.clientX,
      y: event.clientY
    });
  }, 100), [editor]);

  // Close the context menu - optimized to not depend on previous state
  const closeContextMenu = useCallback(() => {
    setContextMenuState(prev => ({ ...prev, visible: false }));
  }, []);

  // Comprehensive cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear any pending timeouts
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      // Destroy the editor instance to prevent memory leaks
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

  // Memoize bubble menu buttons to prevent unnecessary re-renders
  const bubbleMenuButtons = useMemo(() => {
    if (!editor) return null;

    return (
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
    );
  }, [editor]);

  return (
    <div className="tiptap-editor-wrapper">
      {bubbleMenuButtons}

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

      {contextMenuState.visible && editor && (
        <ContextMenu
          editor={editor}
          position={{ x: contextMenuState.x, y: contextMenuState.y }}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
});

export default TipTapEditor;
