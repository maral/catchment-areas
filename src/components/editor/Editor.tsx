"use client";
import { TextToMapController } from "@/controllers/TextToMapController";
import MonacoEditor, { useMonaco } from "@monaco-editor/react";
import debounce from "lodash/debounce";
// import * as monaco from "monaco-editor";
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
        const { errors, warnings } = await TextToMapController.parseOrdinance(
          lines
        );

        errors.forEach((error) => {
          markers.push(
            createMarker(
              8, //MarkerSeverity.Error,
              error.message,
              error.lineNumber,
              error.line
            )
          );
        });

        warnings.forEach((warning) => {
          markers.push(
            createMarker(
              4, //MarkerSeverity.Warning,
              warning.message,
              warning.lineNumber,
              warning.line
            )
          );
        });

        setMarkers(markers);
      }
    }, 1000),
    [monacoInstance]
  );

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
  line: string
): editor.IMarkerData => {
  return {
    severity,
    message,
    startLineNumber: lineNumber,
    startColumn: 1,
    endLineNumber: lineNumber,
    endColumn: line.length + 1,
  };
};
