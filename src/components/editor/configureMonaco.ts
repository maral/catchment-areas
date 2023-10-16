import { SuggestionList } from "@/utils/shared/types";
import MonacoEditor, { IRange, languages } from "monaco-editor";

export type Monaco = typeof MonacoEditor;

interface SyntaxSuggestion {
  label: string;
  insertText: string;
  documentation: string;
  isSnippet: boolean;
}

export const configureMonaco = (
  monaco: Monaco,
  suggestions: SuggestionList[]
) => {
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

  const municipalityTypes: [string, string][] = [
    ["městské části", "MČ"],
    ["městského obvodu", "MO"],
    ["města", "města"],
    ["obce", "obce"],
  ];

  const municipalityPartTypes: string[] = ["města", "obce"];

  const syntaxSuggestionList: SyntaxSuggestion[] = municipalityTypes
    .map((type) => ({
      label: `území ${type[0]} <název ${type[1]}>`,
      insertText: `území ${type[0]} `,
      documentation: `Název ${type[0]} musí být v 1. pádě.`,
      isSnippet: false,
    }))
    .concat(
      municipalityTypes.map((type) => ({
        label: `navíc ulice ${type[0]} <název ${type[1]}>`,
        insertText: `navíc ulice ${type[0]} \${1:municipality}:`,
        documentation: `Název ${type[0]} musí být v 1. pádě. Na tomto řádku nechte pouze toto a ulice ${type[0]} pak pište na další řádky.`,
        isSnippet: true,
      }))
    )
    .concat(
      municipalityPartTypes.map((type) => ({
        label: `část ${type} <název ${type}>`,
        insertText: `část ${type} `,
        documentation: `Název části ${type} musí být v 1. pádě.`,
        isSnippet: false,
      }))
    )
    .concat(
      municipalityTypes.map((type) => ({
        label: `zbytek ${type[0]}`,
        insertText: `zbytek ${type[0]}`,
        documentation: `Přiřadí této škole všechna zbývající adresní místa.`,
        isSnippet: false,
      }))
    )
    .concat(
      municipalityPartTypes.map((type) => ({
        label: `zbytek části ${type} <název ${type}>`,
        insertText: `zbytek části ${type} `,
        documentation: `Název části ${type} musí být v 1. pádě.`,
        isSnippet: false,
      }))
    )
    .concat([
      {
        label: "všechny ostatní budovy bez názvu ulice",
        insertText: "všechny ostatní budovy bez názvu ulice",
        documentation:
          "Všechny budovy bez názvu ulice, pouze s č. p. nebo č. ev., budou přiřazeny této škole.",
        isSnippet: false,
      },
    ]);

  monaco.languages.registerCompletionItemProvider("street-markdown", {
    provideCompletionItems: (model, position) => {
      const range: IRange = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: 0,
        endColumn: model.getLineLength(position.lineNumber) + 1,
      };
      const dbSuggestions: languages.CompletionItem[] = suggestions.flatMap(
        (suggestionList) =>
          suggestionList.texts.map((suggestion) => ({
            label: suggestion,
            kind: monaco.languages.CompletionItemKind.Value,
            insertText: suggestion,
            range: range,
            detail: suggestionList.detail,
          }))
      );

      const syntaxSuggestions: languages.CompletionItem[] =
        syntaxSuggestionList.map((suggestion) => ({
          label: suggestion.label,
          kind: monaco.languages.CompletionItemKind.Value,
          insertText: suggestion.insertText,
          insertTextRules: suggestion.isSnippet
            ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
            : monaco.languages.CompletionItemInsertTextRule.None,
          documentation: suggestion.documentation,
          range: range,
          detail: "jiné",
        }));

      return {
        suggestions: dbSuggestions.concat(syntaxSuggestions),
      };
    },
  });
};
