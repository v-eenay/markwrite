import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import CodeBlock from '@tiptap/extension-code-block';
import EditorToolbar from '../toolbar/EditorToolbar';
import { SafePlaceholder } from './SafePlaceholder';
import './TipTapEditor.css';

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

  // Effect to adjust menu position after it's rendered
  useEffect(() => {
    if (menuRef.current) {
      // Get actual menu dimensions
      const menuRect = menuRef.current.getBoundingClientRect();

      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Set a maximum distance from the edge of the viewport (in pixels)
      const margin = 10;

      // Calculate adjusted position
      let adjustedX = position.x;
      let adjustedY = position.y;

      // Check right edge
      if (position.x + menuRect.width > viewportWidth - margin) {
        adjustedX = viewportWidth - menuRect.width - margin;
      }

      // Check bottom edge
      if (position.y + menuRect.height > viewportHeight - margin) {
        adjustedY = viewportHeight - menuRect.height - margin;
      }

      // Ensure we don't position off the left or top edge
      adjustedX = Math.max(margin, adjustedX);
      adjustedY = Math.max(margin, adjustedY);

      // Apply the adjusted position
      menuRef.current.style.left = `${adjustedX}px`;
      menuRef.current.style.top = `${adjustedY}px`;
    }
  }, [position.x, position.y]);

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

  // Initial menu position style
  const menuStyle = {
    position: 'fixed', // Changed from absolute to fixed for better positioning
    left: `${position.x}px`,
    top: `${position.y}px`,
    zIndex: 1000 // Ensure it's above other elements
  };

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
 * @param {string} props.content - The HTML content to initialize the editor with
 * @param {Function} props.onChange - Callback function when content changes
 */
const TipTapEditor = memo(({ content = '', onChange, useContextMenu = false }) => {
  const [loading, setLoading] = useState(true);
  const lastContentRef = useRef(content);
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
        // Ensure proper handling of Enter key
        keepOnSplit: false,
      },
      // Configure headings to properly handle Enter key
      heading: {
        levels: [1, 2, 3],
        HTMLAttributes: {
          class: 'heading',
        },
        // Don't keep heading style when pressing Enter
        keepOnSplit: false,
      },
      // Use the built-in code block
      codeBlock: true,
      // Configure hard breaks (Enter key behavior)
      hardBreak: {
        keepMarks: true,
      },
    }),
    SafePlaceholder.configure({
      placeholder: 'Write something...',
      emptyEditorClass: 'is-editor-empty',
      emptyNodeClass: 'is-node-empty',
      showOnlyWhenEditable: true,
      includeChildren: false,
      maxRecursionDepth: 3,
    }),
    Link.configure({
      openOnClick: false,
    }),
    Image,
    // Use regular CodeBlock instead of CodeBlockLowlight to avoid stack overflow errors
    CodeBlock.configure({
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
    try {
      if (isInternalUpdateRef.current) return;

      // Clear any pending updates
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      // Use a longer debounce for better performance (300ms)
      updateTimeoutRef.current = setTimeout(() => {
        try {
          // Get HTML content safely
          let html;
          try {
            html = editor.getHTML();
          } catch (htmlError) {
            console.error('Error getting HTML from editor:', htmlError);
            // Fallback to a simpler approach if getHTML fails
            const editorElement = document.querySelector('.ProseMirror');
            html = editorElement ? editorElement.innerHTML : '';
          }

          // Only update if content has actually changed and is valid
          if (html && html !== lastContentRef.current) {
            lastContentRef.current = html;
            onChange(html);
          }
        } catch (error) {
          console.error('Error in editor update handler:', error);
        }
      }, 300); // Debounce time for better performance
    } catch (outerError) {
      // Catch any errors that might occur outside the timeout
      console.error('Critical error in update handler:', outerError);
    }
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

  // No special handler needed for code blocks anymore

  // Initialize the TipTap editor with memoized options
  const editor = useEditor({
    extensions,
    content: content,
    onUpdate: handleUpdate,
    onTransaction: handleTransaction(),
    // Add keyboard event handlers for better editing experience
    editorProps: {
      // Handle keyboard events
      handleKeyDown: (view, event) => {
        // Ensure Enter key creates new paragraphs properly
        if (event.key === 'Enter') {
          // If Shift+Enter, insert a hard break (line break within the same paragraph)
          if (event.shiftKey) {
            editor.chain().focus().setHardBreak().run();
            return true; // Prevent default behavior
          }

          // For regular Enter, handle different node types appropriately
          const { state } = view;
          const { selection } = state;
          const { empty, $from, $to } = selection;
          const nodeType = $from.parent.type.name;

          // Check if we're at the end of a heading
          const isHeading = nodeType.startsWith('heading');
          const isAtEnd = $from.pos === $from.end();

          // Special handling for headings - create a paragraph below when at the end
          if (empty && isHeading && isAtEnd) {
            // Insert a paragraph node after the heading
            editor.chain()
              .focus()
              .createParagraphNear()
              .run();
            return true; // We've handled it
          }

          // If we're at the end of a paragraph, ensure we create a new one
          if (empty && nodeType === 'paragraph' && $from.pos === $to.pos) {
            // Let TipTap handle it with its default behavior
            return false;
          }

          // If we have a selection, replace it and create a paragraph
          if (!empty) {
            editor.chain()
              .focus()
              .deleteSelection()
              .createParagraphNear()
              .run();
            return true;
          }

          // Default behavior for other cases
          return false;
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

  // Update editor content when content prop changes
  useEffect(() => {
    if (!editor || loading) return;

    // Skip update if it's the same as our last known content
    if (content === lastContentRef.current) return;

    try {
      // Mark this as an internal update to prevent feedback loops
      isInternalUpdateRef.current = true;

      // Set the content with a small delay to avoid race conditions
      const timerId = setTimeout(() => {
        editor.commands.setContent(content);
        lastContentRef.current = content;

        // Reset the internal update flag after a short delay
        setTimeout(() => {
          isInternalUpdateRef.current = false;
        }, 50);
      }, 0);

      // Clean up the timer if the component unmounts or the effect runs again
      return () => clearTimeout(timerId);
    } catch (error) {
      console.error('Error updating editor content:', error);
      isInternalUpdateRef.current = false;
    }
  }, [content, editor, loading]);

  // Handle right-click for context menu - optimized with throttling
  // Use editorRef instead of editor to avoid dependency cycle
  const handleContextMenu = useCallback(throttle((event) => {
    // Only handle context menu if useContextMenu is true
    if (!useContextMenu) return;

    const currentEditor = editorRef.current;
    if (!currentEditor) return;

    event.preventDefault();

    // Get the editor's DOM element and its position
    const editorElement = event.currentTarget;
    const editorRect = editorElement.getBoundingClientRect();

    // Get the ProseMirror view
    const view = currentEditor.view;

    // Get the position in the document based on DOM event
    const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });

    // If we couldn't find a valid position, use the event coordinates
    if (pos === null) {
      // Fallback to event coordinates
      const x = event.clientX;
      const y = event.clientY;

      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Set a maximum distance from the edge of the viewport (in pixels)
      const margin = 10;

      // Estimate menu dimensions
      const menuWidth = 180;
      const menuHeight = 300;

      // Adjust position to ensure menu stays within viewport
      let adjustedX = x;
      let adjustedY = y;

      // Check right edge
      if (x + menuWidth > viewportWidth - margin) {
        adjustedX = viewportWidth - menuWidth - margin;
      }

      // Check bottom edge
      if (y + menuHeight > viewportHeight - margin) {
        adjustedY = viewportHeight - menuHeight - margin;
      }

      // Ensure we don't position off the left or top edge
      adjustedX = Math.max(margin, adjustedX);
      adjustedY = Math.max(margin, adjustedY);

      setContextMenuState({
        visible: true,
        x: adjustedX,
        y: adjustedY
      });
      return;
    }

    // Get the coordinates for the position in the document
    const coords = view.coordsAtPos(pos.pos);

    // Calculate position relative to the viewport
    const x = coords.left;
    const y = coords.bottom; // Use bottom to position below the cursor

    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Set a maximum distance from the edge of the viewport (in pixels)
    const margin = 10;

    // Estimate menu dimensions
    const menuWidth = 180;
    const menuHeight = 300;

    // Adjust position to ensure menu stays within viewport
    let adjustedX = x;
    let adjustedY = y;

    // Check right edge
    if (x + menuWidth > viewportWidth - margin) {
      adjustedX = viewportWidth - menuWidth - margin;
    }

    // Check bottom edge
    if (y + menuHeight > viewportHeight - margin) {
      adjustedY = viewportHeight - menuHeight - margin;
    }

    // Ensure we don't position off the left or top edge
    adjustedX = Math.max(margin, adjustedX);
    adjustedY = Math.max(margin, adjustedY);

    setContextMenuState({
      visible: true,
      x: adjustedX,
      y: adjustedY
    });
  }, 100), [useContextMenu]);

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
