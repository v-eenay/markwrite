import React, { useEffect, useRef } from 'react';
import { markdownToHtml } from '../utils/markdownConverter';
import './MarkdownPreview.css';

/**
 * MarkdownPreview - A component that renders Markdown content as HTML
 * 
 * @param {Object} props - Component props
 * @param {string} props.markdown - The Markdown content to render
 * @param {boolean} props.syncScroll - Whether to sync scrolling with the editor
 * @param {React.RefObject} props.editorRef - Reference to the editor element for scroll syncing
 */
const MarkdownPreview = ({ markdown, syncScroll = false, editorRef }) => {
  const previewRef = useRef(null);
  
  // Convert markdown to HTML and render it
  const html = markdownToHtml(markdown || '');
  
  // Sync scrolling between editor and preview
  useEffect(() => {
    if (!syncScroll || !editorRef?.current || !previewRef?.current) return;
    
    const handleEditorScroll = () => {
      const editorElement = editorRef.current;
      const previewElement = previewRef.current;
      
      if (!editorElement || !previewElement) return;
      
      // Calculate scroll percentage
      const editorScrollPercentage = 
        editorElement.scrollTop / 
        (editorElement.scrollHeight - editorElement.clientHeight);
      
      // Apply the same percentage to the preview
      const previewScrollPosition = 
        editorScrollPercentage * 
        (previewElement.scrollHeight - previewElement.clientHeight);
      
      // Set the scroll position without triggering the scroll event
      previewElement.removeEventListener('scroll', handlePreviewScroll);
      previewElement.scrollTop = previewScrollPosition;
      setTimeout(() => {
        previewElement.addEventListener('scroll', handlePreviewScroll);
      }, 50);
    };
    
    const handlePreviewScroll = () => {
      const editorElement = editorRef.current;
      const previewElement = previewRef.current;
      
      if (!editorElement || !previewElement) return;
      
      // Calculate scroll percentage
      const previewScrollPercentage = 
        previewElement.scrollTop / 
        (previewElement.scrollHeight - previewElement.clientHeight);
      
      // Apply the same percentage to the editor
      const editorScrollPosition = 
        previewScrollPercentage * 
        (editorElement.scrollHeight - editorElement.clientHeight);
      
      // Set the scroll position without triggering the scroll event
      editorElement.removeEventListener('scroll', handleEditorScroll);
      editorElement.scrollTop = editorScrollPosition;
      setTimeout(() => {
        editorElement.addEventListener('scroll', handleEditorScroll);
      }, 50);
    };
    
    // Add scroll event listeners
    const editorElement = editorRef.current;
    const previewElement = previewRef.current;
    
    editorElement.addEventListener('scroll', handleEditorScroll);
    previewElement.addEventListener('scroll', handlePreviewScroll);
    
    // Clean up event listeners
    return () => {
      editorElement.removeEventListener('scroll', handleEditorScroll);
      previewElement.removeEventListener('scroll', handlePreviewScroll);
    };
  }, [syncScroll, editorRef]);
  
  return (
    <div className="markdown-preview" ref={previewRef}>
      <div 
        className="markdown-preview-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
};

export default MarkdownPreview;
