"use client";
import Editor, { useMonaco } from "@monaco-editor/react";
import { useEffect, useState } from "react";

export default function EditorPage() {
  const [content, setContent] = useState("");

  useEffect(() => {
    fetch("vyhlaska_CL.txt")
      .then((res) => res.text())
      .then((text) => setContent(text));
  }, []);

  const monaco = useMonaco();

  useEffect(() => {
    if (monaco && content) {
      monaco.editor.getModels()[0].setValue(content);
    }
  }, [monaco, content]);

  return (
    <Editor
      height="90vh"
      value={content}
      onChange={(value) => setContent(value ?? "")}
    />
  );
}
