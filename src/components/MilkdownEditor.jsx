import React, { useEffect, useRef } from 'react';
import { useEditor } from '@milkdown/react';
import { nord } from '@milkdown/theme-nord';
import { defaultValueCtx, Editor, rootCtx, commandsCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { gfm } from '@milkdown/preset-gfm';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { replaceAll } from '@milkdown/utils';

/**
 * MilkdownEditor - A React component that wraps the Milkdown editor
 *
 * @param {Object} props - Component props
 * @param {string} props.markdown - The markdown content to initialize the editor with
 * @param {Function} props.onChange - Callback function when content changes
 * @param {Object} props.editorConfig - Additional configuration options for the editor
 */
const MilkdownEditor = ({ markdown = '', onChange, editorConfig = {} }) => {
  const mountRef = useRef(false);
  // Remove editorInstance state

  // Set up the Milkdown editor - Initialize only ONCE
  const { editor, getInstance, loading } = useEditor((root) => {
    return Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, markdown);
      })
      .use(nord)
      .use(commonmark)
      .use(gfm)
      .use(listener)
      .create();
  }, []);

  // Effect to set up the listener AFTER the editor is ready
  useEffect(() => {
    // Check readiness *inside* the effect
    if (!loading && typeof getInstance === 'function') {
      const instance = getInstance();
      if (instance) {
        // Setup listener using the current onChange callback
        instance.action(ctx => {
          ctx.get(listenerCtx).markdownUpdated((_, markdownContent, prevMarkdownContent) => {
            // Only trigger onChange if the component is mounted and content actually changed
            if (mountRef.current && onChange && markdownContent !== prevMarkdownContent) {
              onChange(markdownContent);
            }
          });
        });
      } else {
        console.warn('Listener setup: Failed to get instance even though not loading and getInstance is function.');
      }
    }
    // Dependencies: Run when loading status changes, getInstance becomes available, or onChange callback changes
  }, [loading, getInstance, onChange]);

  // Effect to mark the component as mounted after initialization
  useEffect(() => {
    if (!loading && !mountRef.current) {
      mountRef.current = true;
    }
  }, [loading]);

  // Effect to update the editor content when the EXTERNAL markdown prop changes
  useEffect(() => {
    let idleCallbackId;

    // Proceed only if: component is mounted, editor not loading, and getInstance is function
    if (mountRef.current && !loading && typeof getInstance === 'function') {
      // Use requestIdleCallback to defer the update until the browser is idle
      idleCallbackId = requestIdleCallback(() => {
        const instance = getInstance();
        // CRUCIAL CHECK: Ensure the instance was successfully retrieved AND seems initialized (e.g., has ctx)
        if (instance && instance.ctx) { // Added check for instance.ctx
          try {
            // Check if the necessary methods exist on the instance
            if (typeof instance.getMarkdown === 'function' && typeof instance.action === 'function') {
              const currentContent = instance.getMarkdown();
              // Update only if the external markdown prop differs from the internal state
              if (currentContent !== markdown) {
                instance.action(replaceAll(markdown));
              }
            } else {
              console.warn('Update effect (idle): Instance is missing expected methods. Update skipped.');
            }
          } catch (e) {
            console.error("Update effect (idle): Error updating Milkdown content:", e);
          }
        } else {
           // Instance might be null/undefined or lack ctx, indicating it's not fully ready
           console.warn('Update effect (idle): Failed to get a fully initialized instance (checked ctx).');
        }
      });
    }

    // Cleanup function to cancel the idle callback if the component unmounts or dependencies change
    return () => {
      if (idleCallbackId) {
        cancelIdleCallback(idleCallbackId);
      }
    };
    // Dependencies: Run when the external markdown prop changes, loading status changes, or getInstance becomes available.
  }, [markdown, loading, getInstance]);

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