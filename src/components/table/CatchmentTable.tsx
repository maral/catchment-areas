"use client";

import type { ColumnDefinition, TableState } from "@/types/tableTypes";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@tremor/react";
import { useCallback, useEffect, useState } from "react";
import Pagination from "./Pagination";

export default function CatchmentTable<T>({
  fetchItems,
  columnDefinitions,
  count,
  showPagination = true,
}: {
  fetchItems: (page: number, limit: number) => Promise<T[]>;
  columnDefinitions: ColumnDefinition<T>[];
  count?: () => Promise<number>;
  showPagination?: boolean;
}) {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tableState, setTableState] = useState<TableState>({
    page: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const response = await fetchItems(tableState.page, tableState.pageSize);
    setItems(response);
    setIsLoading(false);
  }, [
    fetchItems,
    setIsLoading,
    setItems,
    tableState.page,
    tableState.pageSize,
  ]);

  useEffect(() => {
    fetchData();
  }, [tableState.page, tableState.pageSize, fetchData]);

  useEffect(() => {
    if (count) {
      count().then((totalCounted) => {
        setTableState((prev) => ({ ...prev, total: totalCounted }));
      });
    }
  }, [count, setTableState]);

  const noData = isLoading === false && items.length === 0;

  return (
    <div>
      <Table>
        <TableHead>
          <TableRow>
            {columnDefinitions.map((column, index) => (
              <TableHeaderCell key={index} className="p-2">
                {column.title}
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody className={`${isLoading ? "text-slate-500" : ""}`}>
          {items.map((item, i) => (
            <TableRow key={i}>
              {columnDefinitions.map((column, index) => (
                <TableCell key={index} className="p-2">
                  {column.cellFactory(item)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {showPagination && !noData && (
        <Pagination tableState={tableState} setTableState={setTableState} />
      )}
    </div>
  );
}
