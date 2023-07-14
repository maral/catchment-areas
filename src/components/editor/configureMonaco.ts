import MonacoEditor, { IRange } from "monaco-editor";

export type Monaco = typeof MonacoEditor;

export const configureMonaco = (monaco: Monaco) => {
  monaco.editor.defineTheme("smd-theme", {
    base: "vs",
    inherit: true,
    rules: [
      {
        foreground: "1810b9",
        fontStyle: "bold",
        token: "type",
      },

      {
        foreground: "2182be",
        fontStyle: "bold",
        token: "constant",
      },

      {
        foreground: "e89010",
        fontStyle: "bold",
        token: "string.escape",
      },

      {
        foreground: "008000",
        fontStyle: "italic",
        token: "comment",
      },
    ],
    colors: {},
  });

  monaco.languages.register({ id: "street-markdown" });
  monaco.languages.setLanguageConfiguration("street-markdown", {
    comments: {
      lineComment: "!",
    },
  });
  monaco.languages.setMonarchTokensProvider("street-markdown", {
    defaultToken: "",
    tokenPostfix: ".smd",
    accessmodifiers: [],
    keywords: [],
    // prettier-ignore
    typeKeywords: [],
    // prettier-ignore
    operators: ["#"],
    symbols: /[#!-]/,
    escapes:
      /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
    tokenizer: {
      root: [
        // whitespace
        { include: "@whitespace" },

        // founder name
        [/^#.*$/, "constant"],

        // school name
        [/^[^\s]+.*$/, "type", "@streets"],

        // delimiter
        [/[,-]|( a )/, "delimiter"],
      ],

      streets: [
        { include: "@whitespace" },
        [/^[^-]+/, "identifier"], // street name
        [/(-)(.*)$/, ["delimiter", "string.escape"]], // street numbers definition
        [/^\s*$/, "string", "@pop"], // empty row, end of street definitions
      ],

      whitespace: [
        [/[ \t\r\n]+/, "white"],
        [/(^!.*$)/, "comment"],
      ],
    },
  });

  monaco.languages.registerCompletionItemProvider("street-markdown", {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range: IRange = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };
      return {
        suggestions: [
          {
            label: 'Akátová',
            kind: monaco.languages.CompletionItemKind.Value,
            insertText: 'Akátová',
            range: range,
            detail: "ulice"
          },
        ],
      };
    },
  });
};
