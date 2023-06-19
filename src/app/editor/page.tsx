"use client";
import Editor, { useMonaco, loader } from "@monaco-editor/react";
import { useEffect, useState } from "react";
import * as monaco from 'monaco-editor';
import { configureMonaco } from "./configureMonaco";

loader.config({ monaco });

// loader.config({
//   "vs/nls": { availableLanguages: { "*": "cs" } },
// });

export default function EditorPage() {
  const [initialContent, setInitialContent] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    fetch("vyhlaska_CL.txt")
      .then((res) => res.text())
      .then((text) => setInitialContent(text));
  }, []);

  const monaco = useMonaco();

  useEffect(() => {
    if (monaco && initialContent) {
      monaco.editor.getModels()[0].setValue(initialContent);
    }
  }, [monaco, initialContent]);

  return (
    <Editor
      theme="street-markdown"
      beforeMount={configureMonaco}
      className={`h-[calc(100vh-8rem)]`}
      value={content}
      onChange={(value) => setContent(value ?? "")}
      options={{}}
      language="street-markdown"
    />
  );
}
