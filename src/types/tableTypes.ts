import type { JSX } from "react";
export type ColumnDefinition<T> = {
  title: string;
  cellFactory: (
    entityItem: T,
    fetchItems: () => Promise<void>
  ) => JSX.Element | any;
};
