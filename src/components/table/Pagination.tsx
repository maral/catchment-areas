"use client";

import type { TableState } from "@/types/tableTypes";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { TextInput } from "@tremor/react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import IconButton from "../buttons/IconButton";
import Select from "../common/Select";
import _ from "lodash";

const pageSizes = [10, 25, 50, 100, 250];

export default function Pagination({
  tableState,
  setTableState,
  total,
}: {
  tableState: TableState;
  setTableState: Dispatch<SetStateAction<TableState>>;
  total: number;
}) {
  const [newPage, setNewPage] = useState<number>(tableState.page);

  const protectNumberInput = (
    event: React.FormEvent<HTMLInputElement>
  ): void => {
    let targetValue = (event.target as HTMLInputElement).value;
    const inputValue = targetValue;
    const numericValue = inputValue.replace(/[^0-9]/g, "");
    targetValue = numericValue;
  };

  useEffect(() => {
    setNewPage(tableState.page);
  }, [tableState.page]);

  const onPageInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setNewPage(Number(event.target.value));
  };

  const handleInputKeydownEvents = (
    e: React.KeyboardEvent<HTMLInputElement>
  ): void => {
    if (e.key === "Enter" || e.key === "Tab") {
      jumpToPage(newPage);
    } else if (e.key === "Escape") {
      (e.target as HTMLInputElement).blur();
      setNewPage(tableState.page);
    }
  };

  const goToNextPage = (): void => {
    // TODO: add debounce
    paginate(tableState.page + 1);
  };

  const goToPrevPage = (): void => {
    // TODO: add debounce
    paginate(tableState.page - 1);
  };

  const paginate = (page: number): void => {
    if (page < 1 || page > Math.ceil(total / tableState.pageSize)) {
      return;
    }
    setTableState({ ...tableState, page });
  };

  const jumpToPage = (page: number): void => {
    if (page < 1) {
      page = 1;
    } else if (page > Math.ceil(total / tableState.pageSize)) {
      page = Math.ceil(total / tableState.pageSize);
    }
    if (page !== tableState.page) {
      paginate(page);
    }
    setNewPage(page);
  };

  const onPageSizeChange = (value: string | number) => {
    setTableState({ ...tableState, pageSize: Number(value), page: 1 });
  };

  return (
    <div className="flex justify-end items-center p-2">
      <div className="px-3">
        <IconButton
          className="mx-2"
          disabled={tableState.page === 1}
          icon={ChevronLeftIcon}
          onClick={goToPrevPage}
        />
      </div>
      <span className="flex items-center">
        <TextInput
          className="min-w-[4rem] w-[4rem] mr-2 text-center"
          value={newPage.toString()}
          color="slate"
          onClick={(e) => (e.target as HTMLInputElement).select()}
          onChange={onPageInputChange}
          onKeyDown={(e) => handleInputKeydownEvents(e)}
          onBlur={() => {
            jumpToPage(newPage);
          }}
          onInput={(e) => protectNumberInput(e)}
        />
        <span>/ {Math.ceil(total / tableState.pageSize)}</span>
      </span>
      <IconButton
        className="mx-2"
        disabled={tableState.page === Math.ceil(total / tableState.pageSize)}
        icon={ChevronRightIcon}
        onClick={goToNextPage}
      />
      <Select
        items={pageSizes}
        selectValue={tableState.pageSize}
        onValueChange={onPageSizeChange}
      />
    </div>
  );
}
