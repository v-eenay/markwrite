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
import { useTheme } from '../../contexts/ThemeContext';

// Create compartments for dynamic extensions
const languageCompartment = new Compartment();
const autocompletionCompartment = new Compartment();

function CodeMirrorEditor({ value, onChange }) {
  const { theme } = useTheme();
  const editorRef = useRef(null);
  const [currentLanguage, setCurrentLanguage] = useState("markdown");

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
    // Enhanced markdown support with proper strikethrough handling
    markdown({
      base: markdownLanguage,
      codeLanguages: languages,
      addKeymap: true,
      extensions: [],
      // Ensure proper handling of strikethrough and other formatting
      defaultCodeLanguage: null,
      completeHTMLTags: true
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
      // Custom styling for markdown formatting
      ".cm-strikethrough": {
        textDecoration: "line-through",
        color: theme === 'light' ? "#666" : "#999"
      },
      ".cm-strong": {
        fontWeight: "bold",
        color: theme === 'light' ? "#24292e" : "#e0f2f1"
      },
      ".cm-em": {
        fontStyle: "italic"
      },
      ".cm-formatting-strikethrough": {
        color: theme === 'light' ? "#666" : "#999",
        opacity: 0.7
      },
      // Styling for autocompletion
      ".cm-tooltip": {
        border: theme === 'light' ? "1px solid #dbe2ea" : "1px solid #3a3c53",
        backgroundColor: theme === 'light' ? "#ffffff" : "#252733",
        borderRadius: "6px",
        boxShadow: theme === 'light'
          ? "0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)"
          : "0 4px 6px -1px rgba(255, 255, 255, 0.05), 0 2px 4px -1px rgba(255, 255, 255, 0.04)",
        overflow: "hidden"
      },
      ".cm-tooltip.cm-tooltip-autocomplete": {
        "& > ul": {
          fontFamily: "system-ui, -apple-system, sans-serif",
          maxHeight: "300px",
          maxWidth: "400px"
        },
        "& > ul > li": {
          padding: "4px 8px",
          color: theme === 'light' ? "#2f3e46" : "#e0f2f1",
          backgroundColor: theme === 'light' ? "#ffffff" : "#252733",
        },
        "& > ul > li[aria-selected]": {
          backgroundColor: theme === 'light' ? "rgba(142, 202, 230, 0.2)" : "rgba(144, 224, 239, 0.2)",
          color: theme === 'light' ? "#2f3e46" : "#e0f2f1",
        }
      },
      ".cm-completionIcon": {
        marginRight: "8px",
        color: theme === 'light' ? "#8ecae6" : "#90e0ef"
      },
      ".cm-completionLabel": {
        color: theme === 'light' ? "#2f3e46" : "#e0f2f1"
      },
      ".cm-completionDetail": {
        color: theme === 'light' ? "#556872" : "#cdd9e5",
        fontStyle: "italic"
      },
      ".cm-completionMatchedText": {
        color: theme === 'light' ? "#219ebc" : "#90e0ef",
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

    // Use the detected language or default to "markdown" when outside code blocks
    const displayLanguage = detectedLanguage || "markdown";

    // Only update if the language has changed
    if (displayLanguage !== currentLanguage) {
      // Update the current language state
      setCurrentLanguage(displayLanguage);

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
    <div className="h-full flex flex-col">
      <div className="py-2 px-4 bg-background-secondary dark:bg-background-dark-secondary border-b border-border-light dark:border-border-dark flex justify-between items-center">
        <span className="font-medium text-text-secondary dark:text-text-dark-secondary">Markdown</span>
        <span
          className={`text-xs px-2 py-1 rounded ${currentLanguage === 'markdown' ? 'bg-primary-light/20 dark:bg-primary-dark/20 text-primary-hover dark:text-primary-dark' : 'bg-background-secondary dark:bg-background-dark-secondary text-text-secondary dark:text-text-dark-secondary'}`}
          title={currentLanguage === 'markdown'
            ? 'Currently editing Markdown text'
            : `Code block language: ${currentLanguage}`}
        >
          Language: {currentLanguage}
        </span>
      </div>
      <div className="flex-1 overflow-auto">
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
            scrollPastEnd: false, // Don't allow scrolling past the end of the document
          }}
          onCreateEditor={(view) => {
            // Store the CodeMirror view instance on the DOM element for external access
            view.dom.CodeMirror = view;
            view.dom.addEventListener('keyup', () => handleCursorActivity(view));
            view.dom.addEventListener('click', () => handleCursorActivity(view));

            // Force scrollbar visibility and apply custom styling
            const scroller = view.scrollDOM;
            if (scroller) {
              scroller.style.overflow = 'auto';
              scroller.style.overflowY = 'scroll';
              scroller.classList.add('scrollbar-custom');
            }
          }}
          placeholder="Write your markdown here..."
          height="100%"
          style={{ overflow: 'auto', height: '100%' }}
          theme={theme}
        />
      </div>
    </div>
  );
}

export default CodeMirrorEditor;
