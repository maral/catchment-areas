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
import { texts } from "@/utils/shared/texts";

export default function CatchmentTable<T>({
  fetchItems,
  columnDefinitions,
  initialData,
  count,
  showPagination = true,
  noDataText = texts.noData,
}: {
  fetchItems: (page: number, limit: number) => Promise<T[]>;
  columnDefinitions: ColumnDefinition<T>[];
  initialData?: T[];
  count?: number;
  showPagination?: boolean;
  noDataText?: string;
}) {
  const [items, setItems] = useState<T[]>(initialData ?? []);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tableState, setTableState] = useState<TableState>({
    page: 1,
    pageSize: 10,
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
          {items.length === 0 && (<TableRow>
            <TableCell colSpan={columnDefinitions.length} className="p-2 italic">
              {isLoading ? "" : noDataText}
            </TableCell>
          </TableRow>)}
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
        <Pagination
          tableState={tableState}
          total={count ?? 0}
          setTableState={setTableState}
        />
      )}
    </div>
  );
}
