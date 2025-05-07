import React, { useEffect, useRef, useState } from 'react';
import { Editor, rootCtx, defaultValueCtx, commandsCtx } from '@milkdown/core';
import { nord } from '@milkdown/theme-nord';
import { commonmark } from '@milkdown/preset-commonmark';
import { gfm } from '@milkdown/preset-gfm';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { slashFactory } from '@milkdown/plugin-slash';

/**
 * MilkdownReactEditor - A React component that uses Milkdown editor
 *
 * @param {Object} props - Component props
 * @param {string} props.markdown - The markdown content to initialize the editor with
 * @param {Function} props.onChange - Callback function when content changes
 */
const MilkdownReactEditor = ({ markdown = '', onChange }) => {
  const editorRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState(null);
  const lastContentRef = useRef(markdown);
  const updateTimeoutRef = useRef(null);
  const isInternalUpdateRef = useRef(false);

  // Initialize the editor only once
  useEffect(() => {
    if (!editorRef.current) return;

    let isMounted = true;

    const createEditor = async () => {
      try {
        console.log('Initializing MilkdownReactEditor...');

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
          .create();

        // Set up the listener for content changes
        milkdownEditor.action((ctx) => {
          ctx.get(listenerCtx).markdownUpdated((_, markdownContent) => {
            if (!onChange || isInternalUpdateRef.current) return;

            // Clear any pending updates
            if (updateTimeoutRef.current) {
              clearTimeout(updateTimeoutRef.current);
            }

            // Update with a debounced delay (300ms)
            updateTimeoutRef.current = setTimeout(() => {
              lastContentRef.current = markdownContent;
              onChange(markdownContent);
            }, 300);
          });
        });

        if (isMounted) {
          setEditor(milkdownEditor);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing MilkdownReactEditor:', error);
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
      }, 300);
    } catch (error) {
      console.error('Error updating MilkdownReactEditor content:', error);
      isInternalUpdateRef.current = false;
    }
  }, [markdown, editor, loading]);

  return (
    <div className="milkdown-editor-wrapper">
      {/* Editor container */}
      <div className="milkdown-editor" ref={editorRef} />

      {/* Loading indicator */}
      {loading && (
        <div className="milkdown-loading-overlay">
          <div className="milkdown-loading">Loading editor...</div>
        </div>
      )}
    </div>
  );
};

export default MilkdownReactEditor;
