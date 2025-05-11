import React, { useState, useRef, useEffect, useCallback } from 'react';
import SimpleEditor from './SimpleEditor';
import RawEditor from './components/RawEditor';
import MarkdownPreview from './components/MarkdownPreview';
import EditorToolbar from './components/EditorToolbar';
import { markdownToHtml, htmlToMarkdown } from './utils/markdownConverter';
import {
  saveSelection,
  restoreSelection,
  getContentEditableCursorOffset,
  getTextareaCursorPosition,
  setTextareaCursorPosition,
  findPositionByOffset
} from './utils/cursorUtils';
import './MarkdownEditor.css';

/**
 * MarkdownEditor - A rich text editor with Markdown support
 *
 * @param {Object} props - Component props
 * @param {string} props.initialContent - The initial content (HTML or Markdown)
 * @param {Function} props.onChange - Callback function when content changes
 * @param {boolean} props.initialMode - Initial editor mode ('wysiwyg' or 'markdown')
 */
const MarkdownEditor = ({
  initialContent = '',
  onChange,
  initialMode = 'wysiwyg'
}) => {
  // State for editor mode
  const [editorMode, setEditorMode] = useState(initialMode);

  // State for content
  const [htmlContent, setHtmlContent] = useState('');
  const [markdownContent, setMarkdownContent] = useState('');

  // State for preview
  const [showPreview, setShowPreview] = useState(true);

  // State for cursor position
  const [cursorPosition, setCursorPosition] = useState(0);

  // Refs
  const wysiwygEditorRef = useRef(null);
  const markdownEditorRef = useRef(null);
  const updateTimeoutRef = useRef(null);
  const isInternalUpdateRef = useRef(false);
  const savedSelectionRef = useRef(null);

  // Initialize content based on initialContent and initialMode
  useEffect(() => {
    if (!initialContent) return;

    try {
      isInternalUpdateRef.current = true;

      if (initialMode === 'markdown') {
        // If initial mode is markdown, convert to HTML for the WYSIWYG editor
        const markdown = initialContent;
        setMarkdownContent(markdown);

        // Convert markdown to HTML with proper error handling
        try {
          const html = markdownToHtml(markdown);
          setHtmlContent(html);
        } catch (conversionError) {
          console.error('Error converting initial markdown to HTML:', conversionError);
          // Set empty HTML content if conversion fails
          setHtmlContent('');
        }
      } else {
        // If initial mode is WYSIWYG, convert to markdown for the markdown editor
        const html = initialContent;
        setHtmlContent(html);

        // Convert HTML to markdown with proper error handling
        try {
          const markdown = htmlToMarkdown(html);
          setMarkdownContent(markdown);
        } catch (conversionError) {
          console.error('Error converting initial HTML to markdown:', conversionError);
          // Set empty markdown content if conversion fails
          setMarkdownContent('');
        }
      }

      // Reset the internal update flag after a short delay
      setTimeout(() => {
        isInternalUpdateRef.current = false;
      }, 50);
    } catch (error) {
      console.error('Error initializing editor content:', error);
      isInternalUpdateRef.current = false;
    }
  }, [initialContent, initialMode]);

  // Handle WYSIWYG content changes
  const handleWysiwygChange = useCallback((newHtmlContent) => {
    // Skip processing if this is an internal update
    if (isInternalUpdateRef.current) return;

    // Update HTML content state immediately
    setHtmlContent(newHtmlContent);

    // Clear any pending updates to prevent race conditions
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Convert HTML to Markdown with debouncing (300ms as per preferences)
    updateTimeoutRef.current = setTimeout(() => {
      try {
        // Set flag to prevent recursive updates
        isInternalUpdateRef.current = true;

        // Normalize the HTML content to ensure consistent line breaks
        const normalizedHtml = newHtmlContent
          // Replace any sequence of <br> tags with a single <br>
          .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '<br>')
          // Replace any div that only contains a <br> with a single <br>
          .replace(/<div>\s*<br\s*\/?>\s*<\/div>/gi, '<br>')
          // Replace any empty paragraphs with a single <br>
          .replace(/<p>\s*<\/p>/gi, '<br>');

        // Convert HTML to Markdown
        const newMarkdownContent = htmlToMarkdown(normalizedHtml);

        // Update Markdown content state
        setMarkdownContent(newMarkdownContent);

        // Notify parent component with the appropriate content based on current mode
        if (onChange) {
          onChange(editorMode === 'markdown' ? newMarkdownContent : normalizedHtml);
        }

        // Reset the internal update flag after a short delay
        setTimeout(() => {
          isInternalUpdateRef.current = false;
        }, 50);
      } catch (error) {
        console.error('Error converting HTML to Markdown:', error);
        // Reset the flag in case of error
        isInternalUpdateRef.current = false;
      }
    }, 300); // 300ms debounce as per user preferences
  }, [editorMode, onChange]);

  // Handle Markdown content changes
  const handleMarkdownChange = useCallback((newMarkdownContent) => {
    // Skip processing if this is an internal update
    if (isInternalUpdateRef.current) return;

    // Update Markdown content state immediately
    setMarkdownContent(newMarkdownContent);

    // Clear any pending updates to prevent race conditions
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Convert Markdown to HTML with debouncing (300ms as per preferences)
    updateTimeoutRef.current = setTimeout(() => {
      try {
        // Set flag to prevent recursive updates
        isInternalUpdateRef.current = true;

        // Normalize the markdown content to ensure consistent line breaks
        const normalizedMarkdown = newMarkdownContent
          // Ensure consistent line endings
          .replace(/\r\n/g, '\n')
          // Remove any trailing backslashes at the end of lines
          .replace(/\\$/gm, '')
          // Fix any escaped characters that shouldn't be escaped
          .replace(/\\([^\\`*_{}[\]()#+\-.!])/g, '$1');

        // Convert Markdown to HTML
        const newHtmlContent = markdownToHtml(normalizedMarkdown);

        // Update HTML content state
        setHtmlContent(newHtmlContent);

        // Notify parent component with the appropriate content based on current mode
        if (onChange) {
          onChange(editorMode === 'markdown' ? normalizedMarkdown : newHtmlContent);
        }

        // Reset the internal update flag after a short delay
        setTimeout(() => {
          isInternalUpdateRef.current = false;
        }, 50);
      } catch (error) {
        console.error('Error converting Markdown to HTML:', error);
        // Reset the flag in case of error
        isInternalUpdateRef.current = false;
      }
    }, 300); // 300ms debounce as per user preferences
  }, [editorMode, onChange]);

  // Handle cursor position changes in WYSIWYG editor
  const handleWysiwygCursorChange = useCallback((position) => {
    setCursorPosition(position);
  }, []);

  // Handle cursor position changes in Markdown editor
  const handleMarkdownCursorChange = useCallback((position) => {
    setCursorPosition(position);
  }, []);

  // Handle editor mode toggle
  const handleModeToggle = useCallback((newMode) => {
    if (newMode === editorMode) return;

    try {
      // Set flag to prevent recursive updates
      isInternalUpdateRef.current = true;

      // Save current selection/cursor position
      let cursorPos = 0;
      let contentLength = 0;

      if (editorMode === 'wysiwyg' && wysiwygEditorRef.current) {
        // Save selection in WYSIWYG editor
        const selection = saveSelection(wysiwygEditorRef.current);

        if (selection) {
          // Get the cursor offset for approximate position mapping
          cursorPos = getContentEditableCursorOffset(wysiwygEditorRef.current);

          // Get the total content length for relative positioning
          contentLength = wysiwygEditorRef.current.textContent.length;

          // Calculate relative position (0-1) for better mapping between formats
          const relativePos = contentLength > 0 ? cursorPos / contentLength : 0;

          // Store both absolute and relative positions
          savedSelectionRef.current = {
            absolute: cursorPos,
            relative: relativePos,
            contentLength: contentLength
          };
        }
      } else if (editorMode === 'markdown' && markdownEditorRef.current) {
        // Save cursor position in Markdown editor
        cursorPos = getTextareaCursorPosition(markdownEditorRef.current);

        // Get the total content length for relative positioning
        contentLength = markdownEditorRef.current.value.length;

        // Calculate relative position (0-1) for better mapping between formats
        const relativePos = contentLength > 0 ? cursorPos / contentLength : 0;

        // Store both absolute and relative positions
        savedSelectionRef.current = {
          absolute: cursorPos,
          relative: relativePos,
          contentLength: contentLength
        };
      }

      // Switch mode
      setEditorMode(newMode);

      // Restore selection/cursor position after mode switch
      // Use a longer timeout to ensure the editor has fully rendered
      setTimeout(() => {
        try {
          if (newMode === 'wysiwyg' && wysiwygEditorRef.current && savedSelectionRef.current) {
            // For switching to WYSIWYG, find the position in the HTML
            const newContentLength = wysiwygEditorRef.current.textContent.length;

            // Try to use relative position for better mapping between formats
            let targetPos;
            if (savedSelectionRef.current.relative !== undefined && newContentLength > 0) {
              // Calculate new position based on relative position
              targetPos = Math.round(savedSelectionRef.current.relative * newContentLength);
              // Ensure it's within bounds
              targetPos = Math.max(0, Math.min(targetPos, newContentLength));
            } else {
              // Fall back to absolute position
              targetPos = Math.min(savedSelectionRef.current.absolute || 0, newContentLength);
            }

            // Find the position in the DOM
            const position = findPositionByOffset(wysiwygEditorRef.current, targetPos);

            if (position) {
              // Create a new range at the found position
              const range = document.createRange();
              range.setStart(position.node, position.offset);
              range.collapse(true);

              // Apply the range to the selection
              const selection = window.getSelection();
              selection.removeAllRanges();
              selection.addRange(range);

              // Ensure the editor is focused
              wysiwygEditorRef.current.focus();
            }
          } else if (newMode === 'markdown' && markdownEditorRef.current && savedSelectionRef.current) {
            // For switching to Markdown, set the cursor position in the textarea
            const newContentLength = markdownEditorRef.current.value.length;

            // Try to use relative position for better mapping between formats
            let targetPos;
            if (savedSelectionRef.current.relative !== undefined && newContentLength > 0) {
              // Calculate new position based on relative position
              targetPos = Math.round(savedSelectionRef.current.relative * newContentLength);
              // Ensure it's within bounds
              targetPos = Math.max(0, Math.min(targetPos, newContentLength));
            } else {
              // Fall back to absolute position
              targetPos = Math.min(savedSelectionRef.current.absolute || 0, newContentLength);
            }

            // Use a small delay to ensure the textarea is ready
            setTimeout(() => {
              setTextareaCursorPosition(markdownEditorRef.current, targetPos);
            }, 10);
          }
        } catch (error) {
          console.error('Error restoring cursor position after mode switch:', error);
        } finally {
          // Reset the internal update flag
          isInternalUpdateRef.current = false;
        }
      }, 100); // Increased timeout for better reliability
    } catch (error) {
      console.error('Error toggling editor mode:', error);
      isInternalUpdateRef.current = false;
    }
  }, [editorMode]);

  // Handle formatting commands
  const handleFormatCommand = useCallback((command) => {
    if (command.mode === 'wysiwyg') {
      // Execute command in WYSIWYG editor
      document.execCommand('styleWithCSS', false, true);
      document.execCommand(command.command, false, command.value);
    } else if (command.mode === 'markdown') {
      // Apply Markdown syntax in raw editor
      if (!markdownEditorRef.current) return;

      const textarea = markdownEditorRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = textarea.value.substring(start, end);
      let newText = '';

      if (command.options?.wrap) {
        // Wrap selected text with syntax (e.g., **bold**)
        newText = textarea.value.substring(0, start) +
                 command.syntax + selectedText + command.syntax +
                 textarea.value.substring(end);

        // Set new cursor position
        const newCursorPos = end + (command.syntax.length * 2);

        // Update textarea
        textarea.value = newText;
        textarea.selectionStart = textarea.selectionEnd = newCursorPos;
      } else if (command.options?.list) {
        // Add list item prefix to each line
        const lines = selectedText.split('\n');
        const prefixedLines = lines.map(line => command.syntax + line);

        newText = textarea.value.substring(0, start) +
                 prefixedLines.join('\n') +
                 textarea.value.substring(end);

        // Update textarea
        textarea.value = newText;
        textarea.selectionStart = textarea.selectionEnd = end +
                                 (command.syntax.length * lines.length) +
                                 (lines.length - 1);
      } else if (command.options?.block) {
        // Add block prefix (e.g., > for blockquote)
        newText = textarea.value.substring(0, start) +
                 command.syntax + selectedText +
                 textarea.value.substring(end);

        // Update textarea
        textarea.value = newText;
        textarea.selectionStart = textarea.selectionEnd = end + command.syntax.length;
      } else if (command.options?.codeBlock) {
        // Add code block
        newText = textarea.value.substring(0, start) +
                 '```\n' + selectedText + '\n```' +
                 textarea.value.substring(end);

        // Update textarea
        textarea.value = newText;
        textarea.selectionStart = textarea.selectionEnd = end + 8 + selectedText.length;
      } else if (command.options?.link) {
        // Add link syntax
        const url = prompt('Enter the URL:') || 'url';
        newText = textarea.value.substring(0, start) +
                 '[' + (selectedText || 'link text') + '](' + url + ')' +
                 textarea.value.substring(end);

        // Update textarea
        textarea.value = newText;
        textarea.selectionStart = textarea.selectionEnd = start +
                                 (selectedText || 'link text').length +
                                 url.length + 4;
      } else {
        // Simple prefix (e.g., # for heading)
        newText = textarea.value.substring(0, start) +
                 command.syntax + selectedText +
                 textarea.value.substring(end);

        // Update textarea
        textarea.value = newText;
        textarea.selectionStart = textarea.selectionEnd = end + command.syntax.length;
      }

      // Trigger change event
      const event = new Event('input', { bubbles: true });
      textarea.dispatchEvent(event);
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="markdown-editor">
      <EditorToolbar
        editorMode={editorMode}
        onFormatCommand={handleFormatCommand}
        onModeToggle={handleModeToggle}
        showPreview={showPreview}
        onPreviewToggle={setShowPreview}
      />

      <div className={`editor-container ${showPreview ? 'with-preview' : ''}`}>
        <div className="editor-pane">
          {/* Render both editors but only show the active one */}
          <div style={{ display: editorMode === 'wysiwyg' ? 'block' : 'none', height: '100%' }}>
            <SimpleEditor
              initialContent={htmlContent}
              onChange={handleWysiwygChange}
              onCursorPositionChange={handleWysiwygCursorChange}
              editorRef={wysiwygEditorRef}
            />
          </div>

          <div style={{ display: editorMode === 'markdown' ? 'block' : 'none', height: '100%' }}>
            <RawEditor
              content={markdownContent}
              onChange={handleMarkdownChange}
              cursorPosition={cursorPosition}
              onCursorPositionChange={handleMarkdownCursorChange}
              ref={markdownEditorRef}
            />
          </div>
        </div>

        {showPreview && (
          <div className="preview-pane">
            <MarkdownPreview
              markdown={markdownContent}
              syncScroll={true}
              editorRef={editorMode === 'wysiwyg' ? wysiwygEditorRef : markdownEditorRef}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkdownEditor;
