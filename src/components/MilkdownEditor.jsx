import React, { useEffect, useRef, useState } from 'react';
import { Editor, rootCtx, defaultValueCtx, commandsCtx, editorViewCtx } from '@milkdown/core';
import { nord } from '@milkdown/theme-nord';
import { commonmark } from '@milkdown/preset-commonmark';
import { gfm } from '@milkdown/preset-gfm';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { slashFactory } from '@milkdown/plugin-slash';
import { Plugin, PluginKey } from '@milkdown/prose/state';
import { Decoration, DecorationSet } from '@milkdown/prose/view';

// Context menu component
const ContextMenu = ({ commands, position, onClose }) => {
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

  return (
    <div
      className="milkdown-context-menu"
      ref={menuRef}
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
    >
      <div className="milkdown-context-menu-items">
        <button onClick={() => { commands.toggleBold(); onClose(); }}>
          Bold
        </button>
        <button onClick={() => { commands.toggleItalic(); onClose(); }}>
          Italic
        </button>
        <button onClick={() => { commands.toggleStrike(); onClose(); }}>
          Strikethrough
        </button>
        <button onClick={() => { commands.toggleCode(); onClose(); }}>
          Code
        </button>
        <button onClick={() => { commands.toggleLink(); onClose(); }}>
          Link
        </button>
        <div className="milkdown-context-menu-divider"></div>
        <button onClick={() => { commands.toggleHeading(1); onClose(); }}>
          Heading 1
        </button>
        <button onClick={() => { commands.toggleHeading(2); onClose(); }}>
          Heading 2
        </button>
        <button onClick={() => { commands.toggleHeading(3); onClose(); }}>
          Heading 3
        </button>
        <div className="milkdown-context-menu-divider"></div>
        <button onClick={() => { commands.toggleBulletList(); onClose(); }}>
          Bullet List
        </button>
        <button onClick={() => { commands.toggleOrderedList(); onClose(); }}>
          Ordered List
        </button>
        <button onClick={() => { commands.toggleTaskList(); onClose(); }}>
          Task List
        </button>
        <div className="milkdown-context-menu-divider"></div>
        <button onClick={() => { commands.toggleBlockquote(); onClose(); }}>
          Blockquote
        </button>
        <button onClick={() => { commands.insertTable(); onClose(); }}>
          Table
        </button>
        <button onClick={() => { commands.insertCodeBlock(); onClose(); }}>
          Code Block
        </button>
      </div>
    </div>
  );
};

/**
 * MilkdownEditor - A React component that wraps the Milkdown editor
 *
 * @param {Object} props - Component props
 * @param {string} props.markdown - The markdown content to initialize the editor with
 * @param {Function} props.onChange - Callback function when content changes
 * @param {string} props.updateSource - Source of the update ('rich' or 'code')
 */
const MilkdownEditor = ({ markdown = '', onChange, updateSource }) => {
  const editorRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState(null);
  const lastContentRef = useRef(markdown);
  const updateTimeoutRef = useRef(null);
  const isInternalUpdateRef = useRef(false);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });
  const [editorCommands, setEditorCommands] = useState(null);

  // Create a custom plugin for handling right-click events
  const createContextMenuPlugin = () => {
    return new Plugin({
      key: new PluginKey('milkdown-context-menu'),
      props: {
        handleDOMEvents: {
          contextmenu: (view, event) => {
            // Prevent default browser context menu
            event.preventDefault();

            // Get the editor commands
            if (editor) {
              editor.action((ctx) => {
                const commands = ctx.get(commandsCtx);
                setEditorCommands({
                  toggleBold: () => commands.call('toggleBold'),
                  toggleItalic: () => commands.call('toggleItalic'),
                  toggleStrike: () => commands.call('toggleStrike'),
                  toggleCode: () => commands.call('toggleInlineCode'),
                  toggleLink: () => commands.call('toggleLink'),
                  toggleHeading: (level) => commands.call('toggleHeading', level),
                  toggleBulletList: () => commands.call('toggleBulletList'),
                  toggleOrderedList: () => commands.call('toggleOrderedList'),
                  toggleTaskList: () => commands.call('toggleTaskList'),
                  toggleBlockquote: () => commands.call('toggleBlockquote'),
                  insertTable: () => commands.call('insertTable'),
                  insertCodeBlock: () => commands.call('insertCodeBlock'),
                });
              });
            }

            // Show context menu at cursor position
            setContextMenu({
              visible: true,
              x: event.clientX,
              y: event.clientY
            });

            return true;
          }
        }
      }
    });
  };

  // Close the context menu
  const closeContextMenu = () => {
    setContextMenu({ ...contextMenu, visible: false });
  };

  // Initialize the editor only once
  useEffect(() => {
    if (!editorRef.current) return;

    let isMounted = true;

    const createEditor = async () => {
      try {
        console.log('Initializing Milkdown editor...');

        // Create the editor with all necessary plugins
        const milkdownEditor = await Editor.make()
          .config((ctx) => {
            ctx.set(rootCtx, editorRef.current);
            ctx.set(defaultValueCtx, markdown);
          })
          .use(nord)
          .use(commonmark)
          .use(gfm)
          .use(listener)
          .use(slashFactory())
          .use(() => createContextMenuPlugin())
          .create();

        // Set up the listener for content changes
        milkdownEditor.action((ctx) => {
          ctx.get(listenerCtx).markdownUpdated((_, markdownContent) => {
            if (!onChange || isInternalUpdateRef.current) return;

            // Clear any pending updates
            if (updateTimeoutRef.current) {
              clearTimeout(updateTimeoutRef.current);
            }

            // Update with a minimal delay for real-time synchronization
            updateTimeoutRef.current = setTimeout(() => {
              lastContentRef.current = markdownContent;
              onChange(markdownContent);
            }, 10); // Reduced delay for faster response
          });
        });

        if (isMounted) {
          setEditor(milkdownEditor);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing Milkdown editor:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    createEditor();

    // Cleanup function
    return () => {
      isMounted = false;
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []); // Empty dependency array means this only runs once

  // Update editor content when markdown prop changes
  useEffect(() => {
    if (!editor || loading) return;

    // Skip update if it's the same as our last known content
    if (markdown === lastContentRef.current) return;

    // Only update the editor if the change came from the code editor
    // This prevents feedback loops and ensures smooth synchronization
    if (updateSource !== 'code') return;

    try {
      // Mark this as an internal update to prevent feedback loops
      isInternalUpdateRef.current = true;

      // Update the editor content
      editor.action((ctx) => {
        ctx.get(commandsCtx).call('setContent', markdown);
      });

      // Update our reference to the current content
      lastContentRef.current = markdown;

      // Reset the internal update flag after a short delay
      setTimeout(() => {
        isInternalUpdateRef.current = false;
      }, 10); // Reduced delay for faster response
    } catch (error) {
      console.error('Error updating Milkdown content:', error);
      isInternalUpdateRef.current = false;
    }
  }, [markdown, editor, loading, updateSource]);

  return (
    <div className="milkdown-editor-wrapper">
      <div className="milkdown-editor" ref={editorRef} />
      {loading && (
        <div className="milkdown-loading-overlay">
          <div className="milkdown-loading">Loading editor...</div>
        </div>
      )}
      {contextMenu.visible && editorCommands && (
        <ContextMenu
          commands={editorCommands}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
};

export default MilkdownEditor;