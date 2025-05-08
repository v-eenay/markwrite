import React from 'react';
import ToggleableTipTapEditor from './ToggleableTipTapEditor';

/**
 * MilkdownEditor - A React component that wraps the TipTap editor
 * This is a drop-in replacement for the original MilkdownEditor component
 *
 * @param {Object} props - Component props
 * @param {string} props.markdown - The markdown content to initialize the editor with
 * @param {Function} props.onChange - Callback function when content changes

 */
const MilkdownEditor = ({ markdown = '', onChange }) => {
  return (
    <ToggleableTipTapEditor
      markdown={markdown}
      onChange={onChange}
    />
  );
};

export default MilkdownEditor;