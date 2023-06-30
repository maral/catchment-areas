"use client";
import MonacoEditor, { useMonaco } from "@monaco-editor/react";
import debounce from "lodash/debounce";
// import * as monaco from "monaco-editor";
import { TextToMapError } from "@/utils/types";
import type { editor } from "monaco-editor";
import { useCallback, useEffect, useState } from "react";
import { configureMonaco } from "./configureMonaco";

const owner = "street-markdown";

export default function Editor({ text }: { text: string }) {
  const [content, setContent] = useState(text);
  const [markers, setMarkers] = useState<editor.IMarkerData[]>([]);

  const monacoInstance = useMonaco();

  useEffect(() => {
    if (monacoInstance) {
      monacoInstance.editor.setModelMarkers(
        monacoInstance.editor.getModels()[0],
        owner,
        markers
      );
    }
  }, [monacoInstance, markers]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const validate = useCallback(
    debounce(async () => {
      if (monacoInstance) {
        const lines = monacoInstance.editor.getModels()[0].getLinesContent();
        const markers: editor.IMarkerData[] = [];
        const response = await fetch("/api/text-to-map/validate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ lines }),
        });
        const { errors, warnings } = (await response.json()) as {
          errors: TextToMapError[];
          warnings: TextToMapError[];
        };

        errors.forEach((error) => {
          markers.push(
            createMarker(
              8, //MarkerSeverity.Error,
              error.message,
              error.lineNumber,
              error.line,
              error.startOffset,
              error.endOffset
            )
          );
        });

        warnings.forEach((warning) => {
          markers.push(
            createMarker(
              4, //MarkerSeverity.Warning,
              warning.message,
              warning.lineNumber,
              warning.line,
              warning.startOffset,
              warning.endOffset
            )
          );
        });

        setMarkers(markers);
      }
    }, 1000),
    [monacoInstance]
  );

  useEffect(() => {
    if (monacoInstance) {
      validate();
    }
  }, [monacoInstance, validate]);

  return (
    <div>
      <MonacoEditor
        theme="street-markdown"
        beforeMount={configureMonaco}
        className={`h-[calc(100vh-8rem)]`}
        value={content}
        onChange={(value) => {
          setContent(value ?? "");
          validate();
        }}
        options={{}}
        language="street-markdown"
      />
    </div>
  );
}

const createMarker = (
  severity: number, //MarkerSeverity,
  message: string,
  lineNumber: number,
  line: string,
  startOffset: number,
  endOffset: number
): editor.IMarkerData => {
  return {
    severity,
    message,
    startLineNumber: lineNumber,
    startColumn: startOffset + 1,
    endLineNumber: lineNumber,
    endColumn: endOffset + 1,
  };
};
