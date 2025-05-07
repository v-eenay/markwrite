import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Editor, rootCtx, defaultValueCtx, commandsCtx } from '@milkdown/core';
import { nord } from '@milkdown/theme-nord';
import { commonmark } from '@milkdown/preset-commonmark';
import { gfm } from '@milkdown/preset-gfm';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { slashFactory } from '@milkdown/plugin-slash';
import CodeEditor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-markdown';
import 'prismjs/themes/prism-tomorrow.css';
import './ToggleableEditor.css';

/**
 * ToggleableEditor - A component that allows switching between rich text and markdown modes
 *
 * @param {Object} props - Component props
 * @param {string} props.markdown - The markdown content
 * @param {Function} props.onChange - Callback function when content changes
 */
const ToggleableEditor = ({ markdown = '', onChange }) => {
  // State for tracking the current editor mode
  const [isRichTextMode, setIsRichTextMode] = useState(true);

  // Rich Text Editor state
  const richEditorRef = useRef(null);
  const [richEditor, setRichEditor] = useState(null);
  const [richEditorLoading, setRichEditorLoading] = useState(true);

  // Shared state
  const lastContentRef = useRef(markdown);
  const updateSourceRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const isInternalUpdateRef = useRef(false);

  // Initialize the Rich Text Editor
  useEffect(() => {
    if (!isRichTextMode || !richEditorRef.current) return;

    let isMounted = true;

    const createEditor = async () => {
      try {
        console.log('Initializing Rich Text Editor...');

        // Create the editor with all necessary plugins
        const milkdownEditor = await Editor.make()
          .config((ctx) => {
            ctx.set(rootCtx, richEditorRef.current);
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
            if (debounceTimerRef.current) {
              clearTimeout(debounceTimerRef.current);
            }

            // Update with a debounced delay (300ms)
            debounceTimerRef.current = setTimeout(() => {
              updateSourceRef.current = 'rich';
              lastContentRef.current = markdownContent;
              onChange(markdownContent);
            }, 300);
          });
        });

        if (isMounted) {
          setRichEditor(milkdownEditor);
          setRichEditorLoading(false);
        }
      } catch (error) {
        console.error('Error initializing Rich Text Editor:', error);
        if (isMounted) {
          setRichEditorLoading(false);
        }
      }
    };

    createEditor();

    // Cleanup function
    return () => {
      isMounted = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [isRichTextMode, markdown, onChange]);

  // Update Rich Text Editor content when markdown prop changes
  useEffect(() => {
    if (!isRichTextMode || !richEditor || richEditorLoading) return;

    // Skip update if it's the same as our last known content
    if (markdown === lastContentRef.current) return;

    // Only update if the change came from the markdown editor
    if (updateSourceRef.current !== 'code') return;

    try {
      // Mark this as an internal update to prevent feedback loops
      isInternalUpdateRef.current = true;

      // Update the editor content
      richEditor.action((ctx) => {
        ctx.get(commandsCtx).call('setContent', markdown);
      });

      // Update our reference to the current content
      lastContentRef.current = markdown;

      // Reset the internal update flag after a short delay
      setTimeout(() => {
        isInternalUpdateRef.current = false;
      }, 300);
    } catch (error) {
      console.error('Error updating Rich Text Editor content:', error);
      isInternalUpdateRef.current = false;
    }
  }, [isRichTextMode, markdown, richEditor, richEditorLoading]);

  // Handle changes from the Markdown Code Editor
  const handleCodeEditorChange = useCallback((code) => {
    // Skip if this is an internal update
    if (isInternalUpdateRef.current) return;

    // Clear any pending updates
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Update with a debounced delay (300ms)
    debounceTimerRef.current = setTimeout(() => {
      updateSourceRef.current = 'code';
      lastContentRef.current = code;
      onChange(code);
    }, 300);
  }, [onChange]);

  // Toggle between rich text and markdown modes
  const toggleEditorMode = () => {
    setIsRichTextMode(!isRichTextMode);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="toggleable-editor">
      {/* Toggle Switch */}
      <div className="editor-mode-toggle">
        <div className="toggle-label">
          <span className={!isRichTextMode ? 'active' : ''}>Markdown Mode</span>
        </div>

        <label className="switch">
          <input
            type="checkbox"
            checked={isRichTextMode}
            onChange={toggleEditorMode}
          />
          <span className="slider round"></span>
        </label>

        <div className="toggle-label">
          <span className={isRichTextMode ? 'active' : ''}>Rich Text Mode</span>
        </div>
      </div>

      {/* Editor Container */}
      <div className="editor-container">
        {isRichTextMode ? (
          <div className="rich-editor-wrapper">
            {/* Rich Text Editor */}
            <div className="rich-editor" ref={richEditorRef} />

            {/* Loading indicator */}
            {richEditorLoading && (
              <div className="editor-loading-overlay">
                <div className="editor-loading">Loading editor...</div>
              </div>
            )}
          </div>
        ) : (
          <div className="code-editor-wrapper">
            {/* Markdown Code Editor */}
            <CodeEditor
              value={markdown}
              onValueChange={handleCodeEditorChange}
              highlight={(code) => highlight(code, languages.markdown)}
              padding={16}
              className="code-editor"
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 14,
                lineHeight: 1.6,
                minHeight: 300,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ToggleableEditor;
