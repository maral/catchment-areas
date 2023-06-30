"use client";

import CatchmentTable from "@/components/table";
import { Ordinance } from "@/entities/Ordinance";
import type { ColumnDefinition, TableState } from "@/types/tableTypes";
import { useState } from "react";
import { remult } from "remult";

const ordinancesRepo = remult.repo(Ordinance);

export default function OrdinancesTable() {
  const columnDefinitions: ColumnDefinition<Ordinance>[] = [
    {
      title: "Url",
      cellFactory: (item) => item.documentUrl,
    },
    {
      title: "Platnost od",
      cellFactory: (item) => item.validFrom,
    },
    {
      title: "Platnost do",
      cellFactory: (item) => item.validTo,
    },
    {
      title: "Aktivní",
      cellFactory: (item) => item.isActive,
    },
  ];

  const [tableState, setTableState] = useState<TableState>({
    page: 1,
    pageSize: 10,
    total: 0,
  });

  const count = async () => ordinancesRepo.count();

  const fetchItems = async () => {
    return ordinancesRepo.find({
      limit: tableState.pageSize,
      page: tableState.page,
      orderBy: { validFrom: "asc" },
    });
  };

  return (
    <CatchmentTable
      columnDefinitions={columnDefinitions}
      fetchItems={fetchItems}
      tableState={tableState}
      setTableState={setTableState}
      count={count}
    />
  );
}
