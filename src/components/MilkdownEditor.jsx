import React, { useEffect, useRef } from 'react';
import { useEditor } from '@milkdown/react';
import { nord } from '@milkdown/theme-nord';
import { defaultValueCtx, Editor, rootCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { gfm } from '@milkdown/preset-gfm';
import { listener, listenerCtx } from '@milkdown/plugin-listener';

/**
 * MilkdownEditor - A React component that wraps the Milkdown editor
 * 
 * @param {Object} props - Component props
 * @param {string} props.markdown - The markdown content to initialize the editor with
 * @param {Function} props.onChange - Callback function when content changes
 * @param {Object} props.editorConfig - Additional configuration options for the editor
 */
const MilkdownEditor = ({ markdown = '', onChange, editorConfig = {} }) => {
  // Create a ref to track if the component is mounted
  const mountRef = useRef(false);
  
  // Set up the Milkdown editor
  const { editor, getInstance, loading } = useEditor((root) => {
    // Return a new editor instance
    return Editor.make()
      // Apply the nord dark theme
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, markdown);
      })
      // Apply the nord dark theme
      .use(nord)
      // Use the commonmark preset (required for gfm)
      .use(commonmark)
      // Use GitHub Flavored Markdown preset
      .use(gfm)
      // Add the listener plugin for tracking changes
      .use(listener)
      .config((ctx) => {
        // Set up the listener plugin to track changes
        ctx.get(listenerCtx).markdownUpdated((_, markdown) => {
          // Only trigger onChange if the component is mounted
          // This prevents onChange from firing during initialization
          if (mountRef.current && onChange) {
            onChange(markdown);
          }
        });
      })
      // Initialize the editor
      .create();
  }, [markdown, onChange]);

  // Effect to mark the component as mounted after initialization
  useEffect(() => {
    if (!loading) {
      // Mark as mounted after the editor is loaded
      mountRef.current = true;
    }
  }, [loading]);

  // Effect to update the editor content when markdown prop changes
  useEffect(() => {
    // Skip this effect if the editor is still loading or getInstance is not ready
    if (loading || typeof getInstance !== 'function') return;
    
    const instance = getInstance();
    // Get the current content
    const currentContent = instance?.getMarkdown();
    
    // Only update if the content is different from the current markdown
    // This prevents unnecessary re-renders or cursor position resets
    if (currentContent !== markdown) {
      instance?.action((ctx) => {
        ctx.set(defaultValueCtx, markdown);
      });
    }
  }, [markdown, loading, getInstance]); // Restore getInstance to dependencies

  return (
    <div className="milkdown-editor-wrapper">
      {loading ? (
        <div className="milkdown-loading">Loading editor...</div>
      ) : (
        <div className="milkdown-editor" ref={editor} />
      )}
    </div>
  );
};

export default MilkdownEditor;