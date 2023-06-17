export type ColumnDefinition<T> = {
  title: string;
  cellFactory: (entityItem: T) => JSX.Element | any;
}
  
export type TableState = {
  page: number;
  pageSize: number;
  total: number;
};
