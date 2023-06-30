"use client";

import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from "@tremor/react"
import { useEffect, useState, useCallback } from "react";
import type { ColumnDefinition, TableState } from "@/types/tableTypes";
import { ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/solid';
import Select from "../common/Select";
import IconBtn from "../buttons/IconBtn";
import { TextInput } from "@tremor/react";

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
  const [newPage, setNewPage] = useState<number>(tableState.page);

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

  useEffect(() => {
    setNewPage(tableState.page);
  }, [tableState.page])

  const onPageInputChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setNewPage(Number(event.target.value));
  }

  const protectNumberInput = (event: React.FormEvent<HTMLInputElement>): void => {
    let targetValue = (event.target as HTMLInputElement).value;
    const inputValue = targetValue;
    const numericValue = inputValue.replace(/[^0-9]/g, '');
    targetValue = numericValue;
  }

  const handleInputKeydownEvents = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      jumpToPage(newPage);
    } else if (e.key === 'Escape') {
      (e.target as HTMLInputElement).blur();
      setNewPage(tableState.page);
    }
  }

  const goToNextPage = (): void => {
    // TODO: add debounce
    paginate(tableState.page + 1);
  }

  const goToPrevPage = (): void => {
    // TODO: add debounce
    paginate(tableState.page - 1);
  }

  const paginate = (page: number): void => {
    if (page < 1 || page > Math.ceil(tableState.total / tableState.pageSize)) {
      return;
    }
    setTableState({ ...tableState, page });
  }

  const jumpToPage = (page: number): void => {
    console.log('input', page);
    if (page < 1) {
      page = 1;
    } else if (page > Math.ceil(tableState.total / tableState.pageSize)) {
      page = Math.ceil(tableState.total / tableState.pageSize);
    }
    console.log('output', page);
    if (page !== tableState.page) {
      paginate(page);
    }
    setNewPage(page);
  }

  const onPageSizeChange = (value: string | number) => {
    setTableState({ ...tableState, pageSize: Number(value), page: 1 });
  }

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
                  <TableCell key={index} className="p-2">
                    {column.cellFactory(item)}
                  </TableCell>
                ))}
                </TableRow>
              ))}
            </TableBody>
          )
        }
        
      </Table>
      <div className="flex justify-end items-center p-2">
        <div className="px-3">
          <IconBtn
            className="mx-2"
            icon={ChevronLeftIcon}
            onClick={goToPrevPage}
          />
        </div>
        <span className="flex items-center">
          <TextInput
            className="w-8 mr-2"
            value={String(newPage)}
            color="slate"
            onClick={(e) => (e.target as HTMLInputElement).select()}
            onChange={onPageInputChange}
            onKeyDown={(e) => handleInputKeydownEvents(e)}
            onBlur={() => {
              setNewPage(tableState.page);
            }}
            onInput={(e) => protectNumberInput(e)}
          />
          <span>/ {Math.ceil(tableState.total / tableState.pageSize)}</span>
        </span>
          <IconBtn
            className="mx-2"
            icon={ChevronRightIcon}
            onClick={goToNextPage}
          />
        <Select
          items={pageSizes}
          selectValue={tableState.pageSize}
          onValueChange={onPageSizeChange}
        />
      </div>
    </div>
  );
}