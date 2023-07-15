export type ColumnDefinition<T> = {
  title: string;
  cellFactory: (entityItem: T, params?: any) => JSX.Element | any;
}
  
export type TableState = {
  page: number;
  pageSize: number;
};
