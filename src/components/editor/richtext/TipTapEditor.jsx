import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import MarkdownIt from 'markdown-it';
import EditorToolbar from '../toolbar/EditorToolbar';
import './TipTapEditor.css';

// Initialize markdown parser and lowlight - outside component to avoid re-creation
const md = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
  typographer: true
});
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
 * Convert HTML to Markdown using a more efficient approach
 * This function uses regex patterns for common HTML elements
 */
const convertHtmlToMarkdown = (html) => {
  try {
    // Process the HTML in chunks to improve performance
    return html
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
      .replace(/<pre><code.*?>([\s\S]*?)<\/code><\/pre>/g, '```\n$1\n```\n\n')
      .replace(/<ul>([\s\S]*?)<\/ul>/g, '$1\n')
      .replace(/<ol>([\s\S]*?)<\/ol>/g, '$1\n')
      .replace(/<li>(.*?)<\/li>/g, '- $1\n')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .trim();
  } catch (error) {
    console.error('Error converting HTML to Markdown:', error);
    return html;
  }
};

/**
 * Convert Markdown to HTML using markdown-it with improved handling
 * This function properly parses markdown syntax into HTML
 */
const convertMarkdownToHtml = (markdown) => {
  try {
    // Pre-process the markdown to handle special cases
    let processedMarkdown = markdown
      // Ensure proper line breaks for paragraphs
      .replace(/\n\n/g, '\n\n')
      // Fix code blocks that might be malformed
      .replace(/```([^`]+)```/g, (match, code) => {
        // Ensure code blocks have proper line breaks
        if (!code.startsWith('\n')) {
          return '```\n' + code + '\n```';
        }
        return match;
      });

    // Use markdown-it to render the processed markdown
    const html = md.render(processedMarkdown);

    // Post-process the HTML to fix any remaining issues
    return html
      // Ensure empty paragraphs are preserved (for Enter key functionality)
      .replace(/<p><\/p>/g, '<p><br></p>')
      // Fix any malformed list items
      .replace(/<li>\s*<\/li>/g, '<li><br></li>');
  } catch (error) {
    console.error('Error converting Markdown to HTML:', error);
    return markdown;
  }
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
    StarterKit.configure({
      // Ensure proper handling of Enter key for new paragraphs
      paragraph: {
        HTMLAttributes: {
          class: 'paragraph',
        },
      },
      // Improve code block handling
      codeBlock: false,
    }),
    Placeholder.configure({
      placeholder: 'Write something...',
    }),
    Link.configure({
      openOnClick: false,
    }),
    Image,
    CodeBlockLowlight.configure({
      lowlight,
      HTMLAttributes: {
        class: 'code-block',
      },
    }),
  ], []);

  // Create a ref to store the editor instance
  const editorRef = useRef(null);

  // Create a more efficient update handler with increased debounce time
  // This doesn't depend on the editor variable directly
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

        // Use our improved HTML-to-Markdown conversion function
        const content = convertHtmlToMarkdown(html);

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

  // Create a transaction handler that uses the editorRef instead of the editor variable
  const handleTransaction = useCallback(() => {
    // Use a function that will be called when a transaction happens
    return () => {
      // Access the current editor instance from the ref
      const currentEditor = editorRef.current;
      // Only focus if the editor exists and is already in a focused state
      if (currentEditor && currentEditor.isFocused) {
        currentEditor.commands.focus();
      }
    };
  }, []); // No dependencies needed

  // Initialize the TipTap editor with memoized options
  const editor = useEditor({
    extensions,
    content: markdown,
    onUpdate: handleUpdate,
    onTransaction: handleTransaction(),
    // Add keyboard event handlers for better editing experience
    editorProps: {
      // Handle keyboard events
      handleKeyDown: (view, event) => {
        // Ensure Enter key creates new paragraphs properly
        if (event.key === 'Enter' && !event.shiftKey) {
          // Let TipTap handle it normally, but ensure we're tracking the state
          return false; // Return false to let TipTap handle it
        }

        // Handle tab key to indent lists
        if (event.key === 'Tab') {
          // Check if we're in a list
          if (editor && (editor.isActive('bulletList') || editor.isActive('orderedList'))) {
            // Indent or outdent based on shift key
            if (event.shiftKey) {
              editor.chain().focus().liftListItem('listItem').run();
            } else {
              editor.chain().focus().sinkListItem('listItem').run();
            }
            return true; // Prevent default behavior
          }
        }

        return false; // Let TipTap handle other keys
      },
      // Improve click handling for better cursor positioning
      handleClick: (view, pos, event) => {
        // Ensure the editor is focused when clicked
        if (editor && !editor.isFocused) {
          editor.commands.focus();
        }
        return false; // Let TipTap handle the click
      }
    },
    // Ensure proper parsing of Markdown
    parseOptions: {
      preserveWhitespace: 'full',
    }
  });

  // Store the editor instance in the ref whenever it changes
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

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

      // Convert markdown to HTML before setting content
      // This ensures proper rendering of markdown syntax in rich text mode
      const html = convertMarkdownToHtml(markdown);

      // Update the editor content with the HTML
      editor.commands.setContent(html);

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
  // Use editorRef instead of editor to avoid dependency cycle
  const handleContextMenu = useCallback(throttle((event) => {
    const currentEditor = editorRef.current;
    if (!currentEditor) return;

    event.preventDefault();

    setContextMenuState({
      visible: true,
      x: event.clientX,
      y: event.clientY
    });
  }, 100), []);

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
      const currentEditor = editorRef.current;
      if (currentEditor) {
        currentEditor.destroy();
      }
    };
  }, []);

  // Memoize bubble menu buttons to prevent unnecessary re-renders
  // We'll render the BubbleMenu conditionally in the return statement instead
  // This avoids the dependency on editor in the useMemo
  const renderBubbleMenu = () => {
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
  };

  return (
    <div className="tiptap-editor-wrapper">
      {/* Add the formatting toolbar */}
      {editor && <EditorToolbar editor={editor} />}

      {editor && renderBubbleMenu()}

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
