export type ColumnDefinition<T> = {
  title: string;
  cellFactory: (entityItem: T, fetchItems: () => Promise<void>) => JSX.Element | any;
}
  
export type TableState = {
  page: number;
  pageSize: number;
};
