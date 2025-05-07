import React, { useState, useRef, useCallback, useEffect } from 'react';
import MilkdownReactEditor from './MilkdownReactEditor';
import MarkdownCodeEditor from './MarkdownCodeEditor';
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
  
  // Track the source of the update to prevent feedback loops
  const updateSourceRef = useRef(null);
  
  // Debounce timer
  const debounceTimerRef = useRef(null);
  
  // Debounced onChange handler for the rich text editor
  const handleRichTextChange = useCallback((newMarkdown) => {
    // Clear any pending updates
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set the update source
    updateSourceRef.current = 'rich';
    
    // Update with a delay to debounce
    debounceTimerRef.current = setTimeout(() => {
      onChange(newMarkdown);
    }, 300); // 300ms debounce
  }, [onChange]);
  
  // Debounced onChange handler for the markdown editor
  const handleMarkdownChange = useCallback((newMarkdown) => {
    // Clear any pending updates
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set the update source
    updateSourceRef.current = 'code';
    
    // Update with a delay to debounce
    debounceTimerRef.current = setTimeout(() => {
      onChange(newMarkdown);
    }, 300); // 300ms debounce
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
          <MilkdownReactEditor 
            markdown={markdown} 
            onChange={handleRichTextChange} 
          />
        ) : (
          <MarkdownCodeEditor 
            value={markdown} 
            onChange={handleMarkdownChange}
            updateSource={updateSourceRef.current}
          />
        )}
      </div>
    </div>
  );
};

export default ToggleableEditor;
