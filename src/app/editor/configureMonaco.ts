import MonacoEditor from "monaco-editor";

export type Monaco = typeof MonacoEditor;

export const configureMonaco = (monaco: Monaco) => {
  monaco.editor.defineTheme("street-markdown", {
    base: "vs",
    inherit: true,
    rules: [
      {
        foreground: "df1067",
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
    operators: [
      '#',
    ],
    symbols: /[#!-]/,
    // C# style strings
    escapes:
      /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
    tokenizer: {
      root: [
        // identifiers and keywords
        // [
        //   /[a-zA-Z_$][\w$]*/,
        //   {
        //     cases: {
        //       "@typeKeywords": "keyword.type",
        //       "@keywords": "keyword",
        //       "@default": "identifier",
        //     },
        //   },
        // ],
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
};
