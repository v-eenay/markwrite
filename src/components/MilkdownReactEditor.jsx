import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorRef } from '@milkdown/react';
import { nord } from '@milkdown/theme-nord';
import { commonmark } from '@milkdown/preset-commonmark';
import { gfm } from '@milkdown/preset-gfm';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { defaultValueCtx } from '@milkdown/core';
import { slashFactory } from '@milkdown/plugin-slash';

/**
 * MilkdownReactEditor - A React component that uses the @milkdown/react integration
 *
 * @param {Object} props - Component props
 * @param {string} props.markdown - The markdown content to initialize the editor with
 * @param {Function} props.onChange - Callback function when content changes
 */
const MilkdownReactEditor = ({ markdown = '', onChange }) => {
  const editorRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const lastContentRef = useRef(markdown);
  const isInternalUpdateRef = useRef(false);

  // Create the editor using the useEditor hook
  const { editor, loading: editorLoading, getInstance } = useEditor(
    (root) => {
      // Only initialize if we have a root element
      if (!root) return;

      return (
        // Start building the editor
        getInstance()
          // Configure the editor
          .config((ctx) => {
            // Set the default value
            ctx.set(defaultValueCtx, markdown);
          })
          // Add the Nord theme
          .use(nord)
          // Add GitHub Flavored Markdown support
          .use(commonmark)
          .use(gfm)
          // Add the listener plugin for content changes
          .use(listener)
          // Add the slash commands
          .use(slashFactory())
      );
    },
    // Dependencies array - rebuild editor when markdown changes
    [markdown]
  );

  // Set up the content change listener
  useEffect(() => {
    if (!editor || editorLoading) return;

    // Get the editor instance
    const editorInstance = editor.getInstance();
    if (!editorInstance) return;

    // Set up the listener for content changes
    editorInstance.action((ctx) => {
      ctx.get(listenerCtx).markdownUpdated((_, markdownContent) => {
        // Skip if this is an internal update or no onChange handler
        if (!onChange || isInternalUpdateRef.current) return;

        // Skip if content hasn't changed
        if (markdownContent === lastContentRef.current) return;

        // Update the last content reference
        lastContentRef.current = markdownContent;
        
        // Call the onChange handler
        onChange(markdownContent);
      });
    });

    // Update loading state
    setLoading(false);
  }, [editor, editorLoading, onChange]);

  // Update editor content when markdown prop changes
  useEffect(() => {
    if (!editor || editorLoading) return;

    // Skip update if it's the same as our last known content
    if (markdown === lastContentRef.current) return;

    try {
      // Mark this as an internal update to prevent feedback loops
      isInternalUpdateRef.current = true;

      // Update the editor content
      const editorInstance = editor.getInstance();
      if (editorInstance) {
        // Set the new content
        editorInstance.action((ctx) => {
          ctx.set(defaultValueCtx, markdown);
        });
      }

      // Update our reference to the current content
      lastContentRef.current = markdown;

      // Reset the internal update flag after a short delay
      setTimeout(() => {
        isInternalUpdateRef.current = false;
      }, 10);
    } catch (error) {
      console.error('Error updating Milkdown content:', error);
      isInternalUpdateRef.current = false;
    }
  }, [markdown, editor, editorLoading]);

  return (
    <div className="milkdown-editor-wrapper">
      {/* Editor container */}
      <div className="milkdown-editor" ref={editorRef}>
        {/* The editor will be mounted here by the useEditor hook */}
        <EditorRef ref={editor} />
      </div>
      
      {/* Loading indicator */}
      {(loading || editorLoading) && (
        <div className="milkdown-loading-overlay">
          <div className="milkdown-loading">Loading editor...</div>
        </div>
      )}
    </div>
  );
};

export default MilkdownReactEditor;
