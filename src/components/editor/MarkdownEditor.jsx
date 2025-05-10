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
        setMarkdownContent(initialContent);
        setHtmlContent(markdownToHtml(initialContent));
      } else {
        // If initial mode is WYSIWYG, convert to markdown for the markdown editor
        setHtmlContent(initialContent);
        setMarkdownContent(htmlToMarkdown(initialContent));
      }
      
      setTimeout(() => {
        isInternalUpdateRef.current = false;
      }, 0);
    } catch (error) {
      console.error('Error initializing editor content:', error);
      isInternalUpdateRef.current = false;
    }
  }, [initialContent, initialMode]);
  
  // Handle WYSIWYG content changes
  const handleWysiwygChange = useCallback((newHtmlContent) => {
    if (isInternalUpdateRef.current) return;
    
    setHtmlContent(newHtmlContent);
    
    // Clear any pending updates
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Convert HTML to Markdown with debouncing
    updateTimeoutRef.current = setTimeout(() => {
      try {
        isInternalUpdateRef.current = true;
        
        const newMarkdownContent = htmlToMarkdown(newHtmlContent);
        setMarkdownContent(newMarkdownContent);
        
        // Notify parent component
        if (onChange) {
          onChange(editorMode === 'markdown' ? newMarkdownContent : newHtmlContent);
        }
        
        setTimeout(() => {
          isInternalUpdateRef.current = false;
        }, 0);
      } catch (error) {
        console.error('Error converting HTML to Markdown:', error);
        isInternalUpdateRef.current = false;
      }
    }, 300);
  }, [editorMode, onChange]);
  
  // Handle Markdown content changes
  const handleMarkdownChange = useCallback((newMarkdownContent) => {
    if (isInternalUpdateRef.current) return;
    
    setMarkdownContent(newMarkdownContent);
    
    // Clear any pending updates
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Convert Markdown to HTML with debouncing
    updateTimeoutRef.current = setTimeout(() => {
      try {
        isInternalUpdateRef.current = true;
        
        const newHtmlContent = markdownToHtml(newMarkdownContent);
        setHtmlContent(newHtmlContent);
        
        // Notify parent component
        if (onChange) {
          onChange(editorMode === 'markdown' ? newMarkdownContent : newHtmlContent);
        }
        
        setTimeout(() => {
          isInternalUpdateRef.current = false;
        }, 0);
      } catch (error) {
        console.error('Error converting Markdown to HTML:', error);
        isInternalUpdateRef.current = false;
      }
    }, 300);
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
      // Save current selection/cursor position
      if (editorMode === 'wysiwyg' && wysiwygEditorRef.current) {
        savedSelectionRef.current = saveSelection(wysiwygEditorRef.current);
      } else if (editorMode === 'markdown' && markdownEditorRef.current) {
        savedSelectionRef.current = getTextareaCursorPosition(markdownEditorRef.current);
      }
      
      // Switch mode
      setEditorMode(newMode);
      
      // Restore selection/cursor position after mode switch
      setTimeout(() => {
        try {
          if (newMode === 'wysiwyg' && wysiwygEditorRef.current && savedSelectionRef.current) {
            // For switching to WYSIWYG, we need to find the position in the HTML
            const position = findPositionByOffset(wysiwygEditorRef.current, savedSelectionRef.current);
            if (position) {
              const range = document.createRange();
              range.setStart(position.node, position.offset);
              range.collapse(true);
              
              const selection = window.getSelection();
              selection.removeAllRanges();
              selection.addRange(range);
            }
          } else if (newMode === 'markdown' && markdownEditorRef.current && savedSelectionRef.current) {
            // For switching to Markdown, we set the cursor position in the textarea
            setTextareaCursorPosition(markdownEditorRef.current, savedSelectionRef.current);
          }
        } catch (error) {
          console.error('Error restoring cursor position after mode switch:', error);
        }
      }, 0);
    } catch (error) {
      console.error('Error toggling editor mode:', error);
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
          {editorMode === 'wysiwyg' ? (
            <SimpleEditor
              initialContent={htmlContent}
              onChange={handleWysiwygChange}
              onCursorPositionChange={handleWysiwygCursorChange}
              editorRef={wysiwygEditorRef}
            />
          ) : (
            <RawEditor
              content={markdownContent}
              onChange={handleMarkdownChange}
              cursorPosition={cursorPosition}
              onCursorPositionChange={handleMarkdownCursorChange}
              ref={markdownEditorRef}
            />
          )}
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
