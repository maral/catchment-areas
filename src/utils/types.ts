export type RemoveIndex<T> = {
  [K in keyof T as {} extends Record<K, 1> ? never : K]: T[K]
}

export interface ErrorCallbackParams {
  lineNumber: number;
  line: string;
  errors: string[];
}