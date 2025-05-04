import React, { useEffect, useRef, useState } from 'react';
import { Editor, rootCtx, defaultValueCtx, commandsCtx } from '@milkdown/core';
import { nord } from '@milkdown/theme-nord';
import { commonmark } from '@milkdown/preset-commonmark';
import { gfm } from '@milkdown/preset-gfm';
import { listener, listenerCtx } from '@milkdown/plugin-listener';

/**
 * MilkdownEditor - A React component that wraps the Milkdown editor
 *
 * @param {Object} props - Component props
 * @param {string} props.markdown - The markdown content to initialize the editor with
 * @param {Function} props.onChange - Callback function when content changes
 */
const MilkdownEditor = ({ markdown = '', onChange }) => {
  const editorRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState(null);

  // Initialize the editor
  useEffect(() => {
    if (!editorRef.current) return;

    let isMounted = true;
    let milkdownEditor = null;

    const createEditor = async () => {
      try {
        // Create the editor
        milkdownEditor = await Editor.make()
          .config((ctx) => {
            ctx.set(rootCtx, editorRef.current);
            ctx.set(defaultValueCtx, markdown);
          })
          .use(nord)
          .use(commonmark)
          .use(gfm)
          .use(listener)
          .create();

        // Set up the listener for content changes
        milkdownEditor.action((ctx) => {
          ctx.get(listenerCtx).markdownUpdated((_, markdownContent, prevMarkdownContent) => {
            if (onChange && markdownContent !== prevMarkdownContent) {
              onChange(markdownContent);
            }
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
      if (milkdownEditor) {
        milkdownEditor.destroy();
      }
    };
  }, []);

  // Update editor content when markdown prop changes
  useEffect(() => {
    if (!editor || loading) return;

    try {
      const currentContent = editor.getMarkdown();
      if (currentContent !== markdown) {
        editor.action((ctx) => {
          ctx.get(commandsCtx).call('setContent', markdown);
        });
      }
    } catch (error) {
      console.error('Error updating Milkdown content:', error);
    }
  }, [markdown, editor, loading]);

  return (
    <div className="milkdown-editor-wrapper">
      {loading ? (
        <div className="milkdown-loading">Loading editor...</div>
      ) : (
        <div className="milkdown-editor" ref={editorRef} />
      )}
    </div>
  );
};

export default MilkdownEditor;