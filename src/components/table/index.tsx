"use client";

import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from "@tremor/react"
import { useEffect, useState } from "react";
import type { ColumnDefinition, TableState } from "@/types/tableTypes";
import { Select, SelectItem } from "@tremor/react";

export default function CatchmentTable({
  fetchItems,
  columnDefinitions,
  tableState,
  setTableState,
  count,
}: {
  fetchItems: () => Promise<any[]>;
  columnDefinitions: ColumnDefinition[];
  tableState: TableState;
  setTableState: (tableState: TableState) => void;
  count: () => Promise<number>;
}) {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const pageSizes = [10, 25, 50, 100];

  useEffect(() => {
    fetchData();
  }, [tableState.page]);

  useEffect(() => {
    count().then((totalCounted) => {
      setTableState({ ...tableState, total: totalCounted });
    });
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const response = await fetchItems();
    setItems(response);
    setIsLoading(false);
  }

  // Extracts nested attributes from an object using a string of keys
  const itterateThroughNestedAttrs = (object: Record<string, any>, keys: string): any => {
    const key = keys.split('.')[0];
    const nestedKeys = keys.split('.').slice(1).join('.');
    if (nestedKeys.length > 0) {
      return itterateThroughNestedAttrs(object[key], nestedKeys);
    }
    return object[key];
  }

  return (
    <div>
      <Table>
        <TableHead>
          <TableRow>
            {columnDefinitions.map((column) => (
              <TableHeaderCell key={column.key}>
                {column.title}
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHead>
        {
          isLoading ? (
            <></>
            // <div>Loading...</div>
          ) : (
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  {columnDefinitions.map((column) => (
                  <TableCell key={column.key}>
                    {itterateThroughNestedAttrs(item, column.key)}
                  </TableCell>
                ))}
                </TableRow>
              ))}
            </TableBody>
          )
        }
        
      </Table>
      <div className="flex">
        <span>
          {tableState.page} / {Math.ceil(tableState.total / tableState.perPage)}
        </span>
        <Select value={String(tableState.perPage)} >
          {pageSizes.map((pageSize, index) => (
            <SelectItem
              value={String(pageSize)}
              key={index}
            >{pageSize}</SelectItem>
          ))}
        </Select>
      </div>
    </div>
  );
}