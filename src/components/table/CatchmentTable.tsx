"use client";

import type { ColumnDefinition } from "@/types/tableTypes";

import { useCallback, useEffect, useState } from "react";
import { texts } from "@/utils/shared/texts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

export default function CatchmentTable<T>({
  fetchItems,
  columnDefinitions,
  initialData,
  noDataText = texts.noData,
}: {
  fetchItems?: () => Promise<T[]>;
  columnDefinitions: ColumnDefinition<T>[];
  initialData?: T[];
  noDataText?: string;
}) {
  const [items, setItems] = useState<T[]>(initialData ?? []);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    if (fetchItems) {
      setIsLoading(true);
      const response = await fetchItems();
      setItems(response);
      setIsLoading(false);
    }
  }, [fetchItems, setIsLoading, setItems]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setItems(initialData ?? []);
  }, [initialData]);

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            {columnDefinitions.map((column, index) => (
              <TableHead key={index} className="p-2 font-semibold">
                {column.title}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody className={`${isLoading ? "text-slate-500" : ""}`}>
          {items.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={columnDefinitions.length}
                className="p-2 italic"
              >
                {isLoading ? "" : noDataText}
              </TableCell>
            </TableRow>
          )}
          {items.map((item, i) => (
            <TableRow key={i}>
              {columnDefinitions.map((column, index) => (
                <TableCell key={index} className="p-2">
                  {column.cellFactory(item, fetchData)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
