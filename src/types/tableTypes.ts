export type ColumnDefinition<T> = {
  title: string;
  getValue: (entityItem: T) => any;
  cellFactory?: (value: any) => JSX.Element;
}
  
export type TableState = {
  page: number;
  pageSize: number;
  total: number;
};
