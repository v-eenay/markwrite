import { CompletionContext } from '@codemirror/autocomplete';

// Icons for different types of completions
const headingIcon = "# ";
const listIcon = "• ";
const codeIcon = "{ }";
const linkIcon = "🔗";
const imageIcon = "🖼️";
const tableIcon = "⊞";
const quoteIcon = "❝";

/**
 * Provides autocompletion for Markdown syntax elements
 */
export function markdownCompletions(context) {
  const { state, pos } = context;
  const line = state.doc.lineAt(pos);
  const lineStart = line.from;
  const lineText = line.text;
  const textBefore = lineText.slice(0, pos - lineStart);

  // Heading completions (triggered by # at the beginning of a line)
  if (/^(#{1,6})$/.test(textBefore)) {
    return {
      from: lineStart,
      options: [
        { label: "# Heading 1", type: "heading", info: "Largest heading", apply: "# ", detail: "Heading 1", boost: 100, icon: headingIcon },
        { label: "## Heading 2", type: "heading", info: "Second-level heading", apply: "## ", detail: "Heading 2", boost: 90, icon: headingIcon },
        { label: "### Heading 3", type: "heading", info: "Third-level heading", apply: "### ", detail: "Heading 3", boost: 80, icon: headingIcon },
        { label: "#### Heading 4", type: "heading", info: "Fourth-level heading", apply: "#### ", detail: "Heading 4", boost: 70, icon: headingIcon },
        { label: "##### Heading 5", type: "heading", info: "Fifth-level heading", apply: "##### ", detail: "Heading 5", boost: 60, icon: headingIcon },
        { label: "###### Heading 6", type: "heading", info: "Smallest heading", apply: "###### ", detail: "Heading 6", boost: 50, icon: headingIcon },
      ]
    };
  }

  // List completions (triggered by - or * or + at the beginning of a line)
  if (/^[-*+]$/.test(textBefore)) {
    return {
      from: lineStart,
      options: [
        { label: "- Unordered list", type: "list", info: "Bullet list item", apply: "- ", detail: "Unordered list", boost: 100, icon: listIcon },
        { label: "- [ ] Task list", type: "list", info: "Unchecked task list item", apply: "- [ ] ", detail: "Task list", boost: 90, icon: listIcon },
        { label: "- [x] Checked task", type: "list", info: "Checked task list item", apply: "- [x] ", detail: "Checked task", boost: 80, icon: listIcon },
        { label: "1. Ordered list", type: "list", info: "Numbered list item", apply: "1. ", detail: "Ordered list", boost: 70, icon: listIcon },
      ]
    };
  }

  // Ordered list completions (triggered by 1. at the beginning of a line)
  if (/^1\.$/.test(textBefore)) {
    return {
      from: lineStart,
      options: [
        { label: "1. Ordered list", type: "list", info: "Numbered list item", apply: "1. ", detail: "Ordered list", boost: 100, icon: listIcon },
      ]
    };
  }

  // Link completions (triggered by [ or ![)
  if (/\[$/.test(textBefore)) {
    return {
      from: pos - 1,
      options: [
        { label: "[Link text](url)", type: "link", info: "Create a hyperlink", apply: "Link text](url)", detail: "Link", boost: 100, icon: linkIcon },
      ]
    };
  }

  // Image completions (triggered by ![)
  if (/!\[$/.test(textBefore)) {
    return {
      from: pos - 2,
      options: [
        { label: "![Alt text](image-url)", type: "image", info: "Insert an image", apply: "Alt text](image-url)", detail: "Image", boost: 100, icon: imageIcon },
      ]
    };
  }

  // Code block completions (triggered by ```)
  if (/^```$/.test(textBefore)) {
    return {
      from: lineStart,
      options: [
        { label: "```javascript", type: "code", info: "JavaScript code block", apply: "```javascript\n\n```", detail: "JavaScript", boost: 100, icon: codeIcon },
        { label: "```python", type: "code", info: "Python code block", apply: "```python\n\n```", detail: "Python", boost: 95, icon: codeIcon },
        { label: "```html", type: "code", info: "HTML code block", apply: "```html\n\n```", detail: "HTML", boost: 90, icon: codeIcon },
        { label: "```css", type: "code", info: "CSS code block", apply: "```css\n\n```", detail: "CSS", boost: 85, icon: codeIcon },
        { label: "```java", type: "code", info: "Java code block", apply: "```java\n\n```", detail: "Java", boost: 80, icon: codeIcon },
        { label: "```cpp", type: "code", info: "C++ code block", apply: "```cpp\n\n```", detail: "C++", boost: 75, icon: codeIcon },
        { label: "```c", type: "code", info: "C code block", apply: "```c\n\n```", detail: "C", boost: 70, icon: codeIcon },
        { label: "```json", type: "code", info: "JSON code block", apply: "```json\n\n```", detail: "JSON", boost: 65, icon: codeIcon },
        { label: "```markdown", type: "code", info: "Markdown code block", apply: "```markdown\n\n```", detail: "Markdown", boost: 60, icon: codeIcon },
      ]
    };
  }

  // Table completions (triggered by | at the beginning of a line)
  if (/^\|$/.test(textBefore)) {
    return {
      from: lineStart,
      options: [
        {
          label: "| Header 1 | Header 2 |",
          type: "table",
          info: "Create a table with 2 columns",
          apply: "| Header 1 | Header 2 |\n| -------- | -------- |\n| Cell 1   | Cell 2   |",
          detail: "Table (2 columns)",
          boost: 100,
          icon: tableIcon
        },
        {
          label: "| Header 1 | Header 2 | Header 3 |",
          type: "table",
          info: "Create a table with 3 columns",
          apply: "| Header 1 | Header 2 | Header 3 |\n| -------- | -------- | -------- |\n| Cell 1   | Cell 2   | Cell 3   |",
          detail: "Table (3 columns)",
          boost: 90,
          icon: tableIcon
        },
      ]
    };
  }

  // Blockquote completions (triggered by > at the beginning of a line)
  if (/^>$/.test(textBefore)) {
    return {
      from: lineStart,
      options: [
        { label: "> Blockquote", type: "quote", info: "Create a blockquote", apply: "> ", detail: "Blockquote", boost: 100, icon: quoteIcon },
      ]
    };
  }

  // Inline code completions (triggered by `)
  if (/`$/.test(textBefore)) {
    return {
      from: pos - 1,
      options: [
        { label: "`code`", type: "code", info: "Inline code", apply: "code`", detail: "Inline code", boost: 100, icon: codeIcon },
      ]
    };
  }

  // Bold and italic completions (triggered by * or _)
  if (/[*_]$/.test(textBefore)) {
    return {
      from: pos - 1,
      options: [
        { label: "**Bold text**", type: "formatting", info: "Bold text", apply: "*Bold text**", detail: "Bold", boost: 100 },
        { label: "*Italic text*", type: "formatting", info: "Italic text", apply: "Italic text*", detail: "Italic", boost: 90 },
      ]
    };
  }

  // Strikethrough completions (triggered by ~)
  if (/~$/.test(textBefore)) {
    return {
      from: pos - 1,
      options: [
        { label: "~~Strikethrough~~", type: "formatting", info: "Strikethrough text", apply: "~Strikethrough~~", detail: "Strikethrough", boost: 100 },
      ]
    };
  }

  return null;
}
