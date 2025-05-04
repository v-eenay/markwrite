import React from 'react';
import { useEditor } from '@milkdown/react';
import { nord } from '@milkdown/theme-nord';
import { Editor, rootCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';

const BasicEditor = () => {
  const { editor } = useEditor(
    (root) =>
      Editor.make()
        .config((ctx) => {
          ctx.set(rootCtx, root);
        })
        .use(nord)
        .use(commonmark)
        .create()
  );

  return <div ref={editor} />;
};

export default BasicEditor;