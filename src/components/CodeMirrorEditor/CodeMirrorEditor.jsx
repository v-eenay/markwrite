import { useEffect, useRef, useState } from 'react';
import ReactCodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { EditorView } from '@codemirror/view';
import { autocompletion, completionKeymap, startCompletion } from '@codemirror/autocomplete';
import { keymap } from '@codemirror/view';
import { Compartment } from '@codemirror/state';
import { markdownCompletions } from './autocomplete/markdownCompletions';
import { detectCodeBlockLanguage, getLanguageExtension } from './autocomplete/languageDetection';
import './CodeMirrorEditor.css';

// Create compartments for dynamic extensions
const languageCompartment = new Compartment();
const autocompletionCompartment = new Compartment();

function CodeMirrorEditor({ value, onChange }) {
  const editorRef = useRef(null);
  const [currentLanguage, setCurrentLanguage] = useState(null);

  // Custom autocompletion source that combines markdown completions
  // with language-specific completions in code blocks
  const customCompletions = (context) => {
    const { state, pos } = context;

    // Detect if we're in a code block and get the language
    const codeBlockLanguage = detectCodeBlockLanguage(state, pos);

    // If we're in a code block, we'll let the language's own completions handle it
    // but we won't return null as that would disable autocompletion entirely
    if (codeBlockLanguage) {
      // We don't need to do anything special here, as the language extension
      // will provide its own completions when active
      return null;
    }

    // Otherwise, provide markdown completions
    return markdownCompletions(context);
  };

  // Editor extensions
  const extensions = [
    // Basic markdown support
    markdown({
      base: markdownLanguage,
      codeLanguages: languages,
      addKeymap: true
    }),

    // Custom autocompletion (in a compartment so it can be reconfigured)
    autocompletionCompartment.of(
      autocompletion({
        override: [customCompletions],
        defaultKeymap: true,
        maxRenderedOptions: 10,
        activateOnTyping: true,
        icons: true
      })
    ),

    // Add Ctrl+Space to force show completions
    keymap.of([
      ...completionKeymap,
      { key: "Ctrl-Space", run: startCompletion }
    ]),

    // Custom styling
    EditorView.theme({
      "&": {
        height: "100%",
        fontSize: "0.9rem",
        fontFamily: "var(--font-mono)"
      },
      ".cm-content": {
        fontFamily: "var(--font-mono)",
        caretColor: "var(--primary-color)"
      },
      ".cm-line": {
        padding: "0 4px",
        lineHeight: "1.6"
      },
      ".cm-cursor": {
        borderLeftColor: "var(--primary-color)",
        borderLeftWidth: "2px"
      },
      ".cm-activeLine": {
        backgroundColor: "rgba(59, 130, 246, 0.05)"
      },
      ".cm-gutters": {
        backgroundColor: "#f3f4f6",
        color: "#6b7280",
        border: "none"
      },
      ".cm-gutterElement": {
        padding: "0 8px 0 4px"
      },
      // Styling for autocompletion
      ".cm-tooltip": {
        border: "1px solid var(--border-color)",
        backgroundColor: "var(--bg-editor)",
        borderRadius: "6px",
        boxShadow: "var(--shadow-md)",
        overflow: "hidden"
      },
      ".cm-tooltip.cm-tooltip-autocomplete": {
        "& > ul": {
          fontFamily: "var(--font-sans)",
          maxHeight: "300px",
          maxWidth: "400px"
        },
        "& > ul > li": {
          padding: "4px 8px"
        },
        "& > ul > li[aria-selected]": {
          backgroundColor: "rgba(59, 130, 246, 0.1)"
        }
      },
      ".cm-completionIcon": {
        marginRight: "8px",
        color: "var(--primary-color)"
      },
      ".cm-completionLabel": {
        color: "var(--text-color)"
      },
      ".cm-completionDetail": {
        color: "var(--text-light)",
        fontStyle: "italic"
      },
      ".cm-completionMatchedText": {
        color: "var(--primary-color)",
        textDecoration: "none",
        fontWeight: "bold"
      }
    }),

    // Placeholder for dynamic language extensions
    languageCompartment.of([])
  ];

  // Handle editor changes
  const handleChange = (value) => {
    onChange(value);
  };

  // Update language extension when cursor position changes
  const handleCursorActivity = (view) => {
    const { state } = view;
    const pos = state.selection.main.head;

    // Detect if we're in a code block and get the language
    const detectedLanguage = detectCodeBlockLanguage(state, pos);

    // Only update if the language has changed (including changing to/from null)
    if (detectedLanguage !== currentLanguage) {
      // Update the current language state
      setCurrentLanguage(detectedLanguage);

      // Get the language extension if we're in a code block with a recognized language
      const langExtension = getLanguageExtension(detectedLanguage);

      // Create an array to hold the effects we want to dispatch
      const effects = [];

      if (detectedLanguage && langExtension) {
        // We're in a code block with a recognized language
        effects.push(languageCompartment.reconfigure([langExtension]));

        // Configure autocompletion to use language-specific completions
        effects.push(autocompletionCompartment.reconfigure(
          autocompletion({
            override: [], // Use the language's built-in completions
            defaultKeymap: true,
            maxRenderedOptions: 10,
            activateOnTyping: true,
            icons: true
          })
        ));
      } else {
        // We're not in a code block or the language isn't recognized
        effects.push(languageCompartment.reconfigure([]));

        // Reset autocompletion to use markdown completions
        effects.push(autocompletionCompartment.reconfigure(
          autocompletion({
            override: [customCompletions],
            defaultKeymap: true,
            maxRenderedOptions: 10,
            activateOnTyping: true,
            icons: true
          })
        ));
      }

      // Dispatch all effects at once
      if (effects.length > 0) {
        view.dispatch({ effects });
      }
    }
  };

  return (
    <div className="codemirror-editor">
      <div className="editor-header">
        <span>Markdown</span>
        {currentLanguage && (
          <span className="language-indicator" title={`Code block language: ${currentLanguage}`}>
            Language: {currentLanguage}
          </span>
        )}
      </div>
      <div className="editor-container">
        <ReactCodeMirror
          ref={editorRef}
          value={value}
          onChange={handleChange}
          extensions={extensions}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            autocompletion: true,
            foldGutter: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            bracketMatching: true,
          }}
          onCreateEditor={(view) => {
            // Store the CodeMirror view instance on the DOM element for external access
            view.dom.CodeMirror = view;
            view.dom.addEventListener('keyup', () => handleCursorActivity(view));
            view.dom.addEventListener('click', () => handleCursorActivity(view));
          }}
          placeholder="Write your markdown here..."
          height="100%"
        />
      </div>
    </div>
  );
}

export default CodeMirrorEditor;
