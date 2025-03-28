import { FileTypeResult } from "file-type";

export type RemoveIndex<T> = {
  [K in keyof T as {} extends Record<K, 1> ? never : K]: T[K];
};

export interface TextToMapError {
  message: string;
  line: string;
  lineNumber: number;
  startOffset: number;
  endOffset: number;
}

export interface TextExtractionResult {
  text: string | null;
  fileName: string | null;
  fileType: FileTypeResult | null;
}

export interface SuggestionList {
  texts: string[];
  detail: string;
}
