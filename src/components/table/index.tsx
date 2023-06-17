"use client";

import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from "@tremor/react"
import { useEffect, useState, useCallback } from "react";
import type { ColumnDefinition, TableState } from "@/types/tableTypes";
import { ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/solid';
import { Button } from "@tremor/react";

export default function CatchmentTable<T>({
  fetchItems,
  columnDefinitions,
  tableState,
  setTableState,
  count,
}: {
  fetchItems: () => Promise<T[]>;
  columnDefinitions: ColumnDefinition<T>[];
  tableState: TableState;
  setTableState: (tableState: TableState) => void;
  count: () => Promise<number>;
}) {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const pageSizes = [10, 25, 50, 100];

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const response = await fetchItems();
    setItems(response);
    setIsLoading(false);
  }, [fetchItems, setIsLoading, setItems])

  useEffect(() => {
    fetchData();
  }, [tableState.page, tableState.pageSize, fetchData]);

  useEffect(() => {
    count().then((totalCounted) => {
      setTableState({ ...tableState, total: totalCounted });
    });
  }, []);

  const onPageSizeChange = (value: string) => {
    setTableState({ ...tableState, pageSize: Number(value), page: 1 });
  }

  return (
    <div>
      <Table>
        <TableHead>
          <TableRow>
            {columnDefinitions.map((column, index) => (
              <TableHeaderCell key={index}>
                {column.title}
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHead>
        {
          isLoading ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={columnDefinitions.length}>
                  <div>
                    Loading...
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          ) : (
            <TableBody>
              {items.map((item, i) => (
                <TableRow key={i}>
                  {columnDefinitions.map((column, index) => (
                  <TableCell key={index}>
                    {column.cellFactory(item)}
                  </TableCell>
                ))}
                </TableRow>
              ))}
            </TableBody>
          )
        }
        
      </Table>
      <div className="flex justify-end">
        <Button icon={ChevronLeftIcon} />
        <span>
          {tableState.page} / {Math.ceil(tableState.total / tableState.pageSize)}
        </span>
        <Button icon={ChevronRightIcon} />
        
        <select
          value={String(tableState.pageSize)}
          onChange={(event) => onPageSizeChange(event.target.value)}
        >
          {pageSizes.map((pageSize, index) => (
            <option
              value={String(pageSize)}
              key={index}
            >{pageSize}</option>
          ))}
        </select>
      </div>
    </div>
  );
}